// One-time backfill: re-normalize every existing dish image to a uniform 4:3
// WebP (1080×810), matching what new uploads now get (see src/lib/supabase.ts).
//
// Run once, locally, against the live DB/storage:
//   cd backend && npm run backfill:images
//
// Safe to re-run: images already at 1080×810 WebP are skipped.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const MENU_BUCKET = "menu";
const DISH_W = 1080;
const DISH_H = 810; // 4:3

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const dishes = await prisma.dish.findMany({
  where: { imageUrl: { not: null } },
  include: { restaurant: { select: { slug: true } } },
});

console.log(`Found ${dishes.length} dish image(s) to check.\n`);
let normalized = 0, skipped = 0, failed = 0;

for (const d of dishes) {
  try {
    const res = await fetch(d.imageUrl);
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());

    const meta = await sharp(input).metadata();
    if (meta.format === "webp" && meta.width === DISH_W && meta.height === DISH_H) {
      console.log(`· ${d.name} — already normalized, skipped`);
      skipped++;
      continue;
    }

    const out = await sharp(input)
      .rotate()
      .resize(DISH_W, DISH_H, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();

    const path = `${d.restaurant.slug}/dish-${Date.now()}-${d.id.slice(-6)}.webp`;
    const { error } = await supabase.storage
      .from(MENU_BUCKET)
      .upload(path, out, { contentType: "image/webp", upsert: true });
    if (error) throw error;

    const url = supabase.storage.from(MENU_BUCKET).getPublicUrl(path).data.publicUrl;
    await prisma.dish.update({ where: { id: d.id }, data: { imageUrl: url } });

    console.log(`✓ ${d.name} — ${(input.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
    normalized++;
  } catch (e) {
    console.error(`✗ ${d.name} — ${e.message}`);
    failed++;
  }
}

console.log(`\nDone. normalized=${normalized} skipped=${skipped} failed=${failed}`);
await prisma.$disconnect();
