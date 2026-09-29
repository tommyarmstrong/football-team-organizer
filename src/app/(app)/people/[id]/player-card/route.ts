import { createElement } from "react";
import { ImageResponse } from "next/og";
import { crestDataUrl } from "@/lib/postcards/crest";
import { buildPlayerCardPayload } from "@/lib/postcards/player-card";
import {
  PLAYER_CARD_HEIGHT,
  PLAYER_CARD_WIDTH,
  PlayerCardImage,
} from "@/lib/postcards/player-card-image";
import { playerPhotoPlaceholderDataUrl } from "@/lib/postcards/player-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /people/[id]/player-card?player=<playerId>&team=<teamId>`
 *
 * `[id]` is the person; `player` disambiguates when a person holds more than
 * one player record and `team` picks which team's stats appear on the card.
 * Deliberately has no `.png` suffix: the session proxy skips such paths.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const playerId = url.searchParams.get("player");
  if (!playerId) return new Response("Not found", { status: 404 });

  const { data, error } = await buildPlayerCardPayload(playerId, {
    personId: id,
    teamId: url.searchParams.get("team"),
  });
  // Unknown player, no team, and "not allowed" are all the same 404 so the
  // route does not reveal which children exist.
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const [crestSrc, photoSrc] = await Promise.all([
    crestDataUrl(data.clubIconUrl, url.origin),
    playerPhotoPlaceholderDataUrl(url.origin),
  ]);

  try {
    // Satori renders lazily as the body streams, so a layout error would reach
    // the client as a dropped connection. Buffer it to fail as a plain 500.
    const png = await new ImageResponse(
      createElement(PlayerCardImage, { payload: data, crestSrc, photoSrc }),
      { width: PLAYER_CARD_WIDTH, height: PLAYER_CARD_HEIGHT },
    ).arrayBuffer();

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (cause) {
    console.error("Failed to generate player card", cause);
    return new Response("Failed to generate player card", { status: 500 });
  }
}
