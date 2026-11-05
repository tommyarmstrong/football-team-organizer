import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Placeholder artwork for the coach card photo area (1280x720, same neon
 * style as the player placeholder but showing an older coach with a whistle).
 * Lives in `public/`.
 *
 * Loaded from disk rather than HTTP for the same reason as the player
 * placeholder: Vercel Authentication protects integration/preview URLs, so a
 * same-origin fetch would return the SSO login HTML.
 */
export const COACH_PHOTO_PLACEHOLDER_PATH = "/coach-card-photo.jpg";

const COACH_PHOTO_FILE = path.join(
  process.cwd(),
  "public",
  "coach-card-photo.jpg",
);

/**
 * Loads the placeholder artwork as a data URL Satori can embed. Returns null
 * (never throws) when it cannot be loaded so the card falls back to the
 * plain silhouette instead of failing the share.
 */
export async function coachPhotoPlaceholderDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(COACH_PHOTO_FILE);
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
