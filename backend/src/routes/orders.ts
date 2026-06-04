import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { emitToOrder, emitToRestaurant } from "../realtime.js";

const router = Router();

const ACTIVE = ["PLACED", "CONFIRMED", "PREPARING", "READY"] as const;
const ALL_STATUS = ["PLACED", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof ALL_STATUS)[number];

// Live queue — active orders for a restaurant's kitchen
router.get("/:restaurantId", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const includeDelivered = req.query.all === "1";
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      ...(includeDelivered ? {} : { status: { in: ACTIVE as unknown as Status[] } }),
    },
    include: { items: true, table: true, guest: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(orders);
});

// Update order status → push to customer tracker + other kitchen/dashboard screens
router.patch("/:id/status", async (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body.status) as Status;
  if (!ALL_STATUS.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true, table: true, guest: true },
  });

  // → customer phone tracker
  emitToOrder(id, "order:status", { id, status });
  // → all kitchen/dashboard screens for this restaurant
  emitToRestaurant(order.restaurantId, "order:updated", order);

  res.json(order);
});

export default router;
