import { Router } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { uploadDishImage } from "../lib/supabase.js";
import { createDirectUpload, resolveUpload, muxConfigured } from "../lib/mux.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

const CLIENT = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();
// where the customer menu lives — trailing slash stripped so QR URLs are clean
const PUBLIC_BASE = (process.env.PUBLIC_MENU_BASE || CLIENT).replace(/\/+$/, "");

// ─────────── Categories ───────────

router.get("/:restaurantId/categories", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { restaurantId: String(req.params.restaurantId) },
    orderBy: { sortOrder: "asc" },
  });
  res.json(categories);
});

router.post("/:restaurantId/categories", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const count = await prisma.category.count({ where: { restaurantId } });
  const category = await prisma.category.create({
    data: { restaurantId, name: String(req.body.name || "New category"), sortOrder: count },
  });
  res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res) => {
  const updated = await prisma.category.update({
    where: { id: String(req.params.id) },
    data: { name: req.body.name, sortOrder: req.body.sortOrder },
  });
  res.json(updated);
});

router.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: String(req.params.id) } }).catch(() => null);
  res.status(204).end();
});

// ─────────── Dishes ───────────

router.get("/:restaurantId/dishes", async (req, res) => {
  const dishes = await prisma.dish.findMany({
    where: { restaurantId: String(req.params.restaurantId) },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(dishes);
});

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

router.post("/:restaurantId/dishes", upload.single("image"), async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const b = req.body as Record<string, string>;
  let imageUrl: string | undefined;
  if (req.file) imageUrl = await uploadDishImage(restaurant.slug, req.file);

  const dish = await prisma.dish.create({
    data: {
      restaurantId,
      categoryId: b.categoryId || null,
      name: b.name || "New dish",
      description: b.description || null,
      priceRwf: parseInt(b.priceRwf || "0", 10) || 0,
      format: (b.format as "TEXT" | "IMAGE" | "VIDEO" | "IMAGE_VIDEO") || "TEXT",
      imageUrl,
      dietaryTags: parseTags(b.dietaryTags),
      allergens: b.allergens || null,
      available: b.available ? b.available === "true" : true,
    },
    include: { category: true },
  });
  res.status(201).json(dish);
});

router.patch("/dishes/:id", upload.single("image"), async (req, res) => {
  const id = String(req.params.id);
  const dish = await prisma.dish.findUnique({ where: { id }, include: { restaurant: true } });
  if (!dish) return res.status(404).json({ error: "Not found" });

  const b = req.body as Record<string, string>;
  let imageUrl = dish.imageUrl ?? undefined;
  if (req.file) imageUrl = await uploadDishImage(dish.restaurant.slug, req.file);

  const updated = await prisma.dish.update({
    where: { id },
    data: {
      name: b.name ?? dish.name,
      description: b.description ?? dish.description,
      priceRwf: b.priceRwf != null ? parseInt(b.priceRwf, 10) : dish.priceRwf,
      categoryId: b.categoryId !== undefined ? b.categoryId || null : dish.categoryId,
      format: (b.format as "TEXT" | "IMAGE" | "VIDEO" | "IMAGE_VIDEO") ?? dish.format,
      dietaryTags: b.dietaryTags !== undefined ? parseTags(b.dietaryTags) : dish.dietaryTags,
      allergens: b.allergens ?? dish.allergens,
      available: b.available !== undefined ? b.available === "true" : dish.available,
      imageUrl,
    },
    include: { category: true },
  });
  res.json(updated);
});

router.delete("/dishes/:id", async (req, res) => {
  await prisma.dish.delete({ where: { id: String(req.params.id) } }).catch(() => null);
  res.status(204).end();
});

// ─────────── Mux video ───────────

// Start a direct upload for a dish; browser uploads the file straight to Mux.
router.post("/dishes/:id/video-upload", async (req, res) => {
  if (!muxConfigured) return res.status(503).json({ error: "Mux not configured — add MUX keys to .env" });
  const id = String(req.params.id);
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) return res.status(404).json({ error: "Not found" });

  const { uploadId, url } = await createDirectUpload("*");
  await prisma.dish.update({
    where: { id },
    data: { muxUploadId: uploadId, muxStatus: "waiting", format: dish.imageUrl ? "IMAGE_VIDEO" : "VIDEO" },
  });
  res.json({ uploadId, url });
});

// Poll Mux for encoding status; persist playback id + thumbnail when ready.
router.get("/dishes/:id/video-status", async (req, res) => {
  if (!muxConfigured) return res.status(503).json({ error: "Mux not configured" });
  const id = String(req.params.id);
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) return res.status(404).json({ error: "Not found" });
  if (!dish.muxUploadId) return res.json({ status: dish.muxStatus || "none" });

  const result = await resolveUpload(dish.muxUploadId);
  if (result.status === "ready" && result.playbackId) {
    await prisma.dish.update({
      where: { id },
      data: {
        muxAssetId: result.assetId,
        muxPlaybackId: result.playbackId,
        muxStatus: "ready",
        thumbnailUrl: result.thumbnailUrl,
      },
    });
  } else if (result.status !== dish.muxStatus) {
    await prisma.dish.update({ where: { id }, data: { muxStatus: result.status } });
  }
  res.json({ status: result.status, playbackId: result.playbackId, thumbnailUrl: result.thumbnailUrl });
});

router.delete("/dishes/:id/video", async (req, res) => {
  const id = String(req.params.id);
  const dish = await prisma.dish.findUnique({ where: { id } });
  await prisma.dish.update({
    where: { id },
    data: { muxUploadId: null, muxAssetId: null, muxPlaybackId: null, muxStatus: null,
             thumbnailUrl: null, format: dish?.imageUrl ? "IMAGE" : "TEXT" },
  });
  res.status(204).end();
});

// ─────────── Restaurant QR (one general QR per restaurant) ───────────

// PNG QR encoding the restaurant's public menu URL. Customer enters table # at checkout.
router.get("/:restaurantId/qr.png", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: String(req.params.restaurantId) } });
  if (!restaurant) return res.status(404).end();
  const url = `${PUBLIC_BASE}/r/${restaurant.slug}`;
  const png = await QRCode.toBuffer(url, { width: 800, margin: 2, color: { dark: "#171717", light: "#FFFFFF" } });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

// ─────────── Tables (auto-created from orders; used for kitchen/analytics) ───────────

router.get("/:restaurantId/tables", async (req, res) => {
  const tables = await prisma.table.findMany({
    where: { restaurantId: String(req.params.restaurantId) },
    orderBy: { number: "asc" },
  });
  res.json(tables);
});

router.post("/:restaurantId/tables", async (req, res) => {
  const restaurantId = String(req.params.restaurantId);
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  const number = String(req.body.number || "1");
  const qrUrl = `${PUBLIC_BASE}/r/${restaurant.slug}/table/${number}`;
  const table = await prisma.table.upsert({
    where: { restaurantId_number: { restaurantId, number } },
    update: { qrUrl },
    create: { restaurantId, number, qrUrl },
  });
  res.status(201).json(table);
});

router.delete("/tables/:id", async (req, res) => {
  await prisma.table.delete({ where: { id: String(req.params.id) } }).catch(() => null);
  res.status(204).end();
});

// QR code PNG for a table
router.get("/tables/:id/qr.png", async (req, res) => {
  const table = await prisma.table.findUnique({ where: { id: String(req.params.id) } });
  if (!table?.qrUrl) return res.status(404).end();
  const png = await QRCode.toBuffer(table.qrUrl, { width: 600, margin: 2, color: { dark: "#171717", light: "#FFFFFF" } });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

export default router;
