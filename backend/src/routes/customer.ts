import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hlsUrl } from "../lib/mux.js";
import { emitToRestaurant, emitToOrder } from "../realtime.js";
import { momoConfigured, requestToPay, getPaymentStatus } from "../lib/momo.js";

const router = Router();

// ─────────── Public menu by slug ───────────

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      dishes: {
        where: { available: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!restaurant || !restaurant.active) return res.status(404).json({ error: "Restaurant not found" });

  res.json({
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    logoUrl: restaurant.logoUrl,
    primaryColor: restaurant.primaryColor,
    address: restaurant.address,
    paymentMode: restaurant.paymentMode,
    categories: restaurant.categories.map((c) => ({ id: c.id, name: c.name })),
    dishes: restaurant.dishes.map((d) => ({
      id: d.id,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      priceRwf: d.priceRwf,
      format: d.format,
      imageUrl: d.imageUrl,
      thumbnailUrl: d.thumbnailUrl,
      hlsUrl: d.muxPlaybackId ? hlsUrl(d.muxPlaybackId) : null,
      dietaryTags: d.dietaryTags,
      allergens: d.allergens,
    })),
  });
});

// ─────────── Place order ───────────

const orderSchema = z.object({
  tableNumber: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  marketingRestaurant: z.boolean().optional(),
  marketingTablu: z.boolean().optional(),
  items: z.array(z.object({
    dishId: z.string(),
    qty: z.number().int().positive(),
    specialInstructions: z.string().optional(),
  })).min(1),
});

router.post("/:slug/orders", async (req, res) => {
  const slug = String(req.params.slug);
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  // Resolve table (optional)
  let tableId: string | null = null;
  if (body.tableNumber) {
    const table = await prisma.table.upsert({
      where: { restaurantId_number: { restaurantId: restaurant.id, number: body.tableNumber } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        number: body.tableNumber,
        qrUrl: `${process.env.PUBLIC_MENU_BASE || process.env.CLIENT_ORIGIN}/r/${slug}/table/${body.tableNumber}`,
      },
    });
    tableId = table.id;
  }

  // Resolve guest (dedupe by phone if given) + restaurant CRM relationship
  let guestId: string;
  if (body.phone) {
    const guest = await prisma.guest.upsert({
      where: { phone: body.phone },
      update: { name: body.name, email: body.email || undefined },
      create: { name: body.name, phone: body.phone, email: body.email || null },
    });
    guestId = guest.id;
    await prisma.restaurantGuest.upsert({
      where: { restaurantId_guestId: { restaurantId: restaurant.id, guestId } },
      update: {
        lastVisit: new Date(),
        visitCount: { increment: 1 },
        marketingRestaurant: body.marketingRestaurant ?? undefined,
        marketingTablu: body.marketingTablu ?? undefined,
      },
      create: {
        restaurantId: restaurant.id,
        guestId,
        marketingRestaurant: body.marketingRestaurant ?? false,
        marketingTablu: body.marketingTablu ?? false,
      },
    });
  } else {
    const guest = await prisma.guest.create({ data: { name: body.name } });
    guestId = guest.id;
    await prisma.restaurantGuest.create({ data: { restaurantId: restaurant.id, guestId } });
  }

  // Price items from DB (never trust client prices)
  const dishes = await prisma.dish.findMany({
    where: { id: { in: body.items.map((i) => i.dishId) }, restaurantId: restaurant.id },
  });
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  let total = 0;
  const itemData = body.items.flatMap((i) => {
    const dish = dishMap.get(i.dishId);
    if (!dish) return [];
    total += dish.priceRwf * i.qty;
    return [{
      dishId: dish.id,
      nameSnapshot: dish.name,
      qty: i.qty,
      unitPriceRwf: dish.priceRwf,
      specialInstructions: i.specialInstructions || null,
    }];
  });

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId,
      guestId,
      totalRwf: total,
      items: { create: itemData },
    },
    include: { items: true, table: true, guest: true },
  });

  // Notify kitchen + dashboard (Phase 4 listens on this room)
  emitToRestaurant(restaurant.id, "order:new", order);

  res.status(201).json(order);
});

// ─────────── Payment (MoMo) + receipt ───────────

/** Finalize a paid order: mark paid, update CRM spend, create receipt, notify. */
async function finalizePayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "SUCCESSFUL") {
    const existing = await prisma.receipt.findUnique({ where: { orderId } });
    return existing?.publicId;
  }
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "SUCCESSFUL" } });
  if (order.guestId) {
    await prisma.restaurantGuest.updateMany({
      where: { restaurantId: order.restaurantId, guestId: order.guestId },
      data: { totalSpentRwf: { increment: order.totalRwf }, loyaltyPoints: { increment: Math.floor(order.totalRwf / 1000) } },
    });
  }
  const receipt = await prisma.receipt.upsert({
    where: { orderId },
    update: {},
    create: { orderId },
  });
  emitToOrder(orderId, "payment:success", { id: orderId, receiptId: receipt.publicId });
  emitToRestaurant(order.restaurantId, "order:paid", { id: orderId });
  return receipt.publicId;
}

// Initiate payment — real MoMo if configured, else simulated for the demo.
router.post("/orders/:id/pay", async (req, res) => {
  const id = String(req.params.id);
  const phone = String(req.body.phone || "");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (momoConfigured && phone) {
    try {
      const ref = await requestToPay(order.totalRwf, phone, id);
      await prisma.order.update({ where: { id }, data: { momoReference: ref, paymentStatus: "PENDING" } });
      return res.json({ referenceId: ref, simulated: false });
    } catch (e) {
      return res.status(502).json({ error: (e as Error).message });
    }
  }
  // Simulated path
  const ref = `SIM-${id.slice(-8)}`;
  await prisma.order.update({ where: { id }, data: { momoReference: ref, paymentStatus: "PENDING" } });
  res.json({ referenceId: ref, simulated: true });
});

// Poll payment status; finalizes + returns receipt id on success.
router.get("/orders/:id/payment-status", async (req, res) => {
  const id = String(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.paymentStatus === "SUCCESSFUL") {
    const r = await prisma.receipt.findUnique({ where: { orderId: id } });
    return res.json({ status: "SUCCESSFUL", receiptId: r?.publicId });
  }

  const simulated = !momoConfigured || order.momoReference?.startsWith("SIM-");
  if (simulated) {
    const receiptId = await finalizePayment(id);
    return res.json({ status: "SUCCESSFUL", receiptId });
  }

  try {
    const status = await getPaymentStatus(order.momoReference!);
    if (status === "SUCCESSFUL") {
      const receiptId = await finalizePayment(id);
      return res.json({ status, receiptId });
    }
    if (status === "FAILED") {
      await prisma.order.update({ where: { id }, data: { paymentStatus: "FAILED" } });
    }
    res.json({ status });
  } catch (e) {
    res.status(502).json({ error: (e as Error).message });
  }
});

// Public branded receipt
router.get("/receipt/:publicId", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { publicId: String(req.params.publicId) },
    include: {
      order: {
        include: { items: true, table: true, guest: true, restaurant: true },
      },
    },
  });
  if (!receipt) return res.status(404).json({ error: "Receipt not found" });
  const o = receipt.order;
  res.json({
    receiptId: receipt.publicId,
    orderId: o.id,
    date: receipt.createdAt,
    restaurant: { name: o.restaurant.name, logoUrl: o.restaurant.logoUrl, primaryColor: o.restaurant.primaryColor, address: o.restaurant.address },
    table: o.table?.number ?? null,
    guest: o.guest?.name ?? null,
    items: o.items.map((i) => ({ name: i.nameSnapshot, qty: i.qty, unitPriceRwf: i.unitPriceRwf })),
    totalRwf: o.totalRwf,
    paymentMethod: o.momoReference?.startsWith("SIM-") ? "MTN Mobile Money" : "MTN Mobile Money",
    momoReference: o.momoReference,
  });
});

// Order status (for the customer tracker; socket is primary, this is a fallback/poll)
router.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { items: true, table: true },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

export default router;
