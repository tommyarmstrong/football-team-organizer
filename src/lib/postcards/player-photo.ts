import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Placeholder artwork for the player card photo area until players can
 * upload their own photo. Lives in `public/` (1280x720, roughly the photo
 * area's landscape shape, with calm corners for the crest, shirt badge,
 * and age pill).
 *
 * Loaded from disk rather than HTTP: Vercel Authentication protects
 * integration/preview URLs, so a same-origin fetch of `/player-card-photo.jpg`
 * returns the SSO login HTML and the card would silently fall back to the
 * silhouette.
 */
export const PLAYER_PHOTO_PLACEHOLDER_PATH = "/player-card-photo.jpg";

const PLAYER_PHOTO_FILE = path.join(
  process.cwd(),
  "public",
  "player-card-photo.jpg",
);

/**
 * Loads the placeholder artwork as a data URL Satori can embed. Returns null
 * (never throws) when it cannot be loaded so the card falls back to the
 * plain silhouette instead of failing the share.
 */
export async function playerPhotoPlaceholderDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(PLAYER_PHOTO_FILE);
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
