import Mux from "@mux/mux-node";

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

export const muxConfigured = Boolean(tokenId && tokenSecret);

export const mux = muxConfigured
  ? new Mux({ tokenId: tokenId!, tokenSecret: tokenSecret! })
  : null;

/** Create a direct upload URL the browser uploads the video file straight to. */
export async function createDirectUpload(corsOrigin: string) {
  if (!mux) throw new Error("Mux not configured");
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["public"],
      // vertical food clips, keep it lean
      video_quality: "basic",
    },
  });
  return { uploadId: upload.id, url: upload.url };
}

/**
 * Resolve an upload into a ready asset.
 * Returns the playback id + thumbnail once Mux has finished encoding.
 */
export async function resolveUpload(uploadId: string): Promise<{
  status: "waiting" | "preparing" | "ready" | "errored";
  assetId?: string;
  playbackId?: string;
  thumbnailUrl?: string;
}> {
  if (!mux) throw new Error("Mux not configured");

  const upload = await mux.video.uploads.retrieve(uploadId);
  if (!upload.asset_id) {
    return { status: upload.status === "errored" ? "errored" : "waiting" };
  }

  const asset = await mux.video.assets.retrieve(upload.asset_id);
  if (asset.status === "ready") {
    const playbackId = asset.playback_ids?.[0]?.id;
    return {
      status: "ready",
      assetId: asset.id,
      playbackId,
      thumbnailUrl: playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=2`
        : undefined,
    };
  }
  if (asset.status === "errored") return { status: "errored", assetId: asset.id };
  return { status: "preparing", assetId: asset.id };
}

export function hlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}
