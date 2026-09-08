import { createElement } from "react";
import { ImageResponse } from "next/og";
import { clubIconSrc } from "@/lib/clubs/branding";
import { buildMatchPostcardPayload } from "@/lib/postcards/match-postcard";
import {
  MatchPostcardImage,
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
} from "@/lib/postcards/postcard-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RASTER_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

async function crestDataUrl(
  iconUrl: string | null,
  origin: string,
): Promise<string | null> {
  const src = clubIconSrc(iconUrl);
  const absolute = src.startsWith("http")
    ? src
    : new URL(src, origin).toString();
  try {
    const response = await fetch(absolute);
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!RASTER_TYPES.has(mime)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { data, error } = await buildMatchPostcardPayload(id);
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const crestSrc = await crestDataUrl(data.clubIconUrl, origin);

  try {
    return new ImageResponse(
      createElement(MatchPostcardImage, { payload: data, crestSrc }),
      {
        width: POSTCARD_WIDTH,
        height: POSTCARD_HEIGHT,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (cause) {
    console.error("Failed to generate match postcard", cause);
    return new Response("Failed to generate postcard", { status: 500 });
  }
}
