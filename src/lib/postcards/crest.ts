import { clubIconSrc } from "@/lib/clubs/branding";

const RASTER_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/**
 * Loads a club crest as a data URL Satori can embed. Returns null (never
 * throws) for missing, unreachable, or non-raster icons so a broken crest
 * falls back to the club initial instead of failing the share.
 */
export async function crestDataUrl(
  iconUrl: string | null,
  origin: string,
): Promise<string | null> {
  const src = clubIconSrc(iconUrl);
  const absolute = src.startsWith("http")
    ? src
    : new URL(src, origin).toString();
  try {
    const response = await fetch(absolute);
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!RASTER_TYPES.has(mime)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
