import { createClient } from "@supabase/supabase-js";

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

/** Upload a dish image, return its public URL. */
export async function uploadDishImage(
  restaurantSlug: string,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> {
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${restaurantSlug}/dish-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(MENU_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
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
