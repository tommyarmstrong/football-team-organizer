/**
 * Storage object path for a Supabase public URL, or null when the URL does not
 * point into `bucket`.
 */
export function publicStoragePath(
  photoUrl: string | null | undefined,
  bucket: string,
): string | null {
  if (!photoUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(
    photoUrl.slice(index + marker.length).split("?")[0] ?? "",
  );
  return path || null;
}
