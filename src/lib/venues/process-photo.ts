import sharp from "sharp";

/** Longest edge of a stored venue photo, in pixels (display is ~512px wide). */
export const VENUE_PHOTO_MAX_EDGE = 1600;
export const VENUE_PHOTO_WEBP_QUALITY = 80;
/** Refuse absurdly large decoded images (decompression bombs). */
const MAX_INPUT_PIXELS = 64_000_000;

export type ProcessedVenuePhoto = {
  bytes: Uint8Array;
  contentType: "image/webp";
  extension: "webp";
};

/**
 * Normalise an uploaded venue photo before it is stored:
 * - applies the EXIF orientation, so the picture still looks upright,
 * - shrinks it to at most 1600px on its longest edge (never enlarges),
 * - re-encodes it as WebP,
 * - drops ALL metadata (EXIF such as GPS location, camera and date; XMP; IPTC;
 *   embedded colour profile; thumbnails). Sharp only keeps metadata when asked
 *   to, and we never ask; the colour is converted to sRGB first.
 *
 * Animated GIFs keep only their first frame. Throws when the bytes are not a
 * decodable image.
 */
export async function processVenuePhoto(
  input: Uint8Array,
): Promise<ProcessedVenuePhoto> {
  const output = await sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate()
    .resize({
      width: VENUE_PHOTO_MAX_EDGE,
      height: VENUE_PHOTO_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toColorspace("srgb")
    .webp({ quality: VENUE_PHOTO_WEBP_QUALITY })
    .toBuffer();

  return {
    bytes: new Uint8Array(output),
    contentType: "image/webp",
    extension: "webp",
  };
}
