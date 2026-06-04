import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { uploadLogo } from "../lib/supabase.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  paymentMode: z.enum(["UPFRONT", "AFTER"]).optional(),
});

// List all restaurants
router.get("/restaurants", async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { dishes: true, tables: true, orders: true } } },
  });
  res.json(restaurants);
});

// Get one (by id or slug)
router.get("/restaurants/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { categories: true, _count: { select: { dishes: true, tables: true } } },
  });
  if (!restaurant) return res.status(404).json({ error: "Not found" });
  res.json(restaurant);
});

// Create restaurant (with optional logo upload)
router.post("/restaurants", upload.single("logo"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) return res.status(409).json({ error: `Slug "${slug}" already taken` });

  let logoUrl: string | undefined;
  if (req.file) logoUrl = await uploadLogo(slug, req.file);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      slug,
      logoUrl,
      primaryColor: data.primaryColor || "#F25623",
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      paymentMode: data.paymentMode || "AFTER",
    },
  });
  res.status(201).json(restaurant);
});

// Update restaurant branding / details
router.patch("/restaurants/:id", upload.single("logo"), async (req, res) => {
  const id = String(req.params.id);
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return res.status(404).json({ error: "Not found" });

  let logoUrl = restaurant.logoUrl ?? undefined;
  if (req.file) logoUrl = await uploadLogo(restaurant.slug, req.file);

  const b = req.body as Record<string, string | undefined>;
  const updated = await prisma.restaurant.update({
    where: { id },
    data: {
      name: b.name ?? restaurant.name,
      primaryColor: b.primaryColor ?? restaurant.primaryColor,
      address: b.address ?? restaurant.address,
      phone: b.phone ?? restaurant.phone,
      email: b.email ?? restaurant.email,
      paymentMode: (b.paymentMode as "UPFRONT" | "AFTER") ?? restaurant.paymentMode,
      logoUrl,
    },
  });
  res.json(updated);
});

// Delete restaurant
router.delete("/restaurants/:id", async (req, res) => {
  const id = String(req.params.id);
  await prisma.restaurant.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
});

export default router;
