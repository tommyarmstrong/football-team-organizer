import { VENUE_PHOTOS_BUCKET } from "@/lib/constants";

export const VENUE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const VENUE_PHOTO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Returns an error message when the file cannot be used as a venue photo. */
export function validateVenuePhoto(file: File): string | null {
  if (!VENUE_PHOTO_MIME_TYPES.has(file.type)) {
    return "Photo must be a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > VENUE_PHOTO_MAX_BYTES) {
    return "Photo must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Storage object path for a venue photo public URL, or null when the URL does
 * not point into the venue photos bucket.
 */
export function venuePhotoStoragePath(
  photoUrl: string | null | undefined,
): string | null {
  if (!photoUrl) return null;
  const marker = `/storage/v1/object/public/${VENUE_PHOTOS_BUCKET}/`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(
    photoUrl.slice(index + marker.length).split("?")[0] ?? "",
  );
  return path || null;
}
