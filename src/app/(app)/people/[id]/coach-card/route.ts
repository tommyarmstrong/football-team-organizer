import { createElement } from "react";
import { ImageResponse } from "next/og";
import { crestDataUrl } from "@/lib/postcards/crest";
import { buildCoachCardPayload } from "@/lib/postcards/coach-card";
import {
  COACH_CARD_HEIGHT,
  COACH_CARD_WIDTH,
  CoachCardImage,
} from "@/lib/postcards/coach-card-image";
import { coachPhotoPlaceholderDataUrl } from "@/lib/postcards/coach-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /people/[id]/coach-card?coach=<coachId>&team=<teamId>`
 *
 * `[id]` is the person; `coach` disambiguates when a person holds more than
 * one coach record and `team` picks which team's record appears on the card.
 * Deliberately has no `.png` suffix: the session proxy skips such paths.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const coachId = url.searchParams.get("coach");
  if (!coachId) return new Response("Not found", { status: 404 });

  const { data, error } = await buildCoachCardPayload(coachId, {
    personId: id,
    teamId: url.searchParams.get("team"),
  });
  // Unknown coach, no team, and "not allowed" are all the same 404 so the
  // route does not reveal which coaches exist.
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const [crestSrc, photoSrc] = await Promise.all([
    crestDataUrl(data.clubIconUrl, url.origin),
    coachPhotoPlaceholderDataUrl(),
  ]);

  try {
    // Satori renders lazily as the body streams, so a layout error would reach
    // the client as a dropped connection. Buffer it to fail as a plain 500.
    const png = await new ImageResponse(
      createElement(CoachCardImage, { payload: data, crestSrc, photoSrc }),
      { width: COACH_CARD_WIDTH, height: COACH_CARD_HEIGHT },
    ).arrayBuffer();

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (cause) {
    console.error("Failed to generate coach card", cause);
    return new Response("Failed to generate coach card", { status: 500 });
  }
}
