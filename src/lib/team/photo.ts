import {
  TEAM_PHOTO_MAX_BYTES,
  TEAM_PHOTO_MIME_TYPES,
  TEAM_PHOTOS_BUCKET,
} from "@/lib/constants";
import { publicStoragePath } from "@/lib/photos/storage-path";

/** Returns an error message when the file cannot be used as a team photo. */
export function validateTeamPhoto(file: File): string | null {
  if (!TEAM_PHOTO_MIME_TYPES.has(file.type)) {
    return "Photo must be a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > TEAM_PHOTO_MAX_BYTES) {
    return "Photo must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Storage object path for a team photo public URL, or null when the URL does
 * not point into the team photos bucket.
 */
export function teamPhotoStoragePath(
  photoUrl: string | null | undefined,
): string | null {
  return publicStoragePath(photoUrl, TEAM_PHOTOS_BUCKET);
}
