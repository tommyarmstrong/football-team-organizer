import { imageDataUrl } from "@/lib/postcards/crest";

/**
 * Placeholder artwork for the player card photo area until players can
 * upload their own photo. Served from `public/` (1280x720, roughly the
 * photo area's landscape shape, with calm corners for the crest, shirt
 * badge, and age pill).
 */
export const PLAYER_PHOTO_PLACEHOLDER_PATH = "/player-card-photo.jpg";

/**
 * Loads the placeholder artwork as a data URL Satori can embed. Returns null
 * (never throws) when it cannot be loaded so the card falls back to the
 * plain silhouette instead of failing the share.
 */
export async function playerPhotoPlaceholderDataUrl(
  origin: string,
): Promise<string | null> {
  return imageDataUrl(
    new URL(PLAYER_PHOTO_PLACEHOLDER_PATH, origin).toString(),
  );
}
