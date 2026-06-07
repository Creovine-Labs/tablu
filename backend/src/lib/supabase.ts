import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Service-role client — backend only, full storage/admin access. */
export const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const BRANDING_BUCKET = "branding";
export const MENU_BUCKET = "menu";

async function ensureBucket(name: string, fileSizeLimit: string) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) {
    await supabase.storage.createBucket(name, {
      public: true,
      fileSizeLimit,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
    });
  }
}

/** Public buckets for logos + dish images. Idempotent — safe to call on boot. */
export async function ensureBrandingBucket() {
  await ensureBucket(BRANDING_BUCKET, "5MB");
  await ensureBucket(MENU_BUCKET, "10MB");
}

// Every dish image is normalized to a uniform 4:3 frame so the menu grid looks
// consistent (matches the frontend's aspect-[4/3] cards) and stays lightweight.
const DISH_W = 1080;
const DISH_H = 810; // 1080 × 810 = 4:3

/** Upload a dish image — normalized to a uniform 4:3 WebP — return its public URL. */
export async function uploadDishImage(
  restaurantSlug: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  // Resize + center-crop to a fixed 4:3 box, then compress to WebP.
  const normalized = await sharp(file.buffer)
    .rotate() // respect EXIF orientation (phone photos)
    .resize(DISH_W, DISH_H, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  const path = `${restaurantSlug}/dish-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from(MENU_BUCKET)
    .upload(path, normalized, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  return supabase.storage.from(MENU_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Upload a logo buffer, return its public URL. */
export async function uploadLogo(
  restaurantSlug: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "png";
  const path = `${restaurantSlug}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
