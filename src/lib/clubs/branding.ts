import { DEFAULT_CLUB_ICON_SRC } from "@/lib/constants";

const HEX_COLOUR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidClubColour(value: string): boolean {
  return HEX_COLOUR_RE.test(value);
}

/** Normalise user colour input to #RRGGBB, or null when empty/invalid. */
export function parseClubColour(
  raw: string,
): string | null | { error: string } {
  const value = raw.trim();
  if (!value) return null;
  const withHash = value.startsWith("#") ? value : `#${value}`;
  if (!isValidClubColour(withHash)) {
    return { error: "Club colour must be a hex value like #1B4D3E." };
  }
  return withHash.toUpperCase();
}

export function clubIconSrc(iconUrl: string | null | undefined): string {
  return iconUrl?.trim() || DEFAULT_CLUB_ICON_SRC;
}

export const CLUB_ICON_MAX_BYTES = 512 * 1024;

export const CLUB_ICON_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function clubIconExtension(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return null;
  }
}
