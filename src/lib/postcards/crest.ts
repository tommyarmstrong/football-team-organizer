import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { clubIconSrc } from "@/lib/clubs/branding";

const RASTER_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Drawn at 84px; rasterise at 2× so the badge stays sharp in the PNG. */
const BADGE_PX = 168;

function dataUrl(mime: string, bytes: Buffer): string {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function mimeFromPath(src: string): string {
  const ext = path.extname(src).toLowerCase();
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "";
}

/** A public-folder path, or null when it could leave `public/`. */
function publicFilePath(src: string): string | null {
  if (!src.startsWith("/") || src.includes("..")) return null;
  const root = path.resolve(process.cwd(), "public");
  const file = path.resolve(root, src.slice(1));
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
  return file;
}

/**
 * Satori can embed PNG and JPEG, not SVG. The default club badge is an SVG,
 * so it is drawn to a PNG before it goes on the card.
 */
async function svgToPngDataUrl(bytes: Buffer): Promise<string | null> {
  try {
    const png = await sharp(bytes, { density: 192 })
      .resize(BADGE_PX, BADGE_PX, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return dataUrl("image/png", png);
  } catch {
    return null;
  }
}

async function bytesToDataUrl(
  bytes: Buffer,
  mime: string,
): Promise<string | null> {
  const type = mime.toLowerCase();
  if (RASTER_TYPES.has(type)) return dataUrl(type, bytes);
  if (type === "image/svg+xml") return svgToPngDataUrl(bytes);
  return null;
}

/**
 * Fetches an image as a data URL Satori can embed. SVG responses are drawn
 * to PNG. Returns null (never throws) when the image is missing or unusable.
 */
export async function imageDataUrl(absolute: string): Promise<string | null> {
  try {
    const response = await fetch(absolute);
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      ?.trim()
      .toLowerCase();
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytesToDataUrl(bytes, mime ?? "");
  } catch {
    return null;
  }
}

/**
 * Loads a club crest as a data URL Satori can embed. The default badge is
 * read from `public/` so the card does not depend on fetching its own host.
 * Returns null (never throws) for a missing or unusable icon, and the card
 * then shows the club initial.
 */
export async function crestDataUrl(
  iconUrl: string | null,
  origin: string,
): Promise<string | null> {
  const src = clubIconSrc(iconUrl);
  const local = publicFilePath(src);
  if (local) {
    try {
      const bytes = await readFile(local);
      const embedded = await bytesToDataUrl(bytes, mimeFromPath(src));
      if (embedded) return embedded;
    } catch {
      // Fall through to a fetch of the same public path.
    }
  }
  const absolute = src.startsWith("http")
    ? src
    : new URL(src, origin).toString();
  return imageDataUrl(absolute);
}
