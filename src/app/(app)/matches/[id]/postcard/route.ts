import { createElement } from "react";
import { ImageResponse } from "next/og";
import { crestDataUrl } from "@/lib/postcards/crest";
import { buildMatchPostcardPayload } from "@/lib/postcards/match-postcard";
import {
  MatchPostcardImage,
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
} from "@/lib/postcards/postcard-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    // Satori renders lazily as the body streams, so a layout error would reach
    // the client as a dropped connection. Buffer it to fail as a plain 500.
    const png = await new ImageResponse(
      createElement(MatchPostcardImage, { payload: data, crestSrc }),
      { width: POSTCARD_WIDTH, height: POSTCARD_HEIGHT },
    ).arrayBuffer();

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (cause) {
    console.error("Failed to generate match postcard", cause);
    return new Response("Failed to generate postcard", { status: 500 });
  }
}
