import { createElement } from "react";
import { ImageResponse } from "next/og";
import { isValidClubColour } from "@/lib/clubs/branding";
import {
  PLAYER_CARD_HEIGHT,
  PLAYER_CARD_WIDTH,
  PlayerCardImage,
} from "@/lib/postcards/player-card-image";
import { playerPhotoPlaceholderDataUrl } from "@/lib/postcards/player-photo";
import { samplePlayerCardPayload } from "@/lib/report/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /team/report/sample/card?player=sample-player-1&colour=FFD400`
 *
 * Renders the real player card from fabricated data, so the sample report's
 * Player Gallery shows true cards without a database. Development only.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const rawColour = url.searchParams.get("colour");
  const colour = rawColour ? `#${rawColour.replace(/^#/, "")}` : undefined;
  const payload = samplePlayerCardPayload(
    url.searchParams.get("player") ?? "",
    { colour: colour && isValidClubColour(colour) ? colour : undefined },
  );
  if (!payload) return new Response("Not found", { status: 404 });

  const photoSrc = await playerPhotoPlaceholderDataUrl();
  const png = await new ImageResponse(
    createElement(PlayerCardImage, { payload, crestSrc: null, photoSrc }),
    { width: PLAYER_CARD_WIDTH, height: PLAYER_CARD_HEIGHT },
  ).arrayBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
