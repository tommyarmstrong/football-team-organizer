/**
 * Browser-side venue photo shrinking. Phone photos are often 5-12 MB, which
 * is more than a Server Action request can carry on the host, so we scale the
 * picture down and re-encode it before upload. Re-encoding through a canvas
 * also drops EXIF metadata. The server repeats the resize and strips metadata
 * again (see `process-photo.ts`), so this step is a convenience, not a
 * security boundary.
 */

export const CLIENT_PHOTO_MAX_EDGE = 1600;
const CLIENT_PHOTO_JPEG_QUALITY = 0.85;

/** Scale `width` x `height` to fit inside `maxEdge`, never enlarging. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Returns a smaller JPEG copy of `file`, or the original file when the browser
 * cannot decode or re-encode it (the server then validates it as usual).
 */
export async function shrinkPhotoForUpload(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      CLIENT_PHOTO_MAX_EDGE,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CLIENT_PHOTO_JPEG_QUALITY),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
