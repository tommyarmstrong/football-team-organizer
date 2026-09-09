import { createElement } from "react";
import { ImageResponse } from "next/og";
import { describe, expect, it } from "vitest";
import {
  MatchPostcardImage,
  POSTCARD_HEIGHT,
  POSTCARD_WIDTH,
} from "@/lib/postcards/postcard-image";
import type {
  MatchPostcardPayload,
  PostcardGoalList,
} from "@/lib/postcards/types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const basePayload: MatchPostcardPayload = {
  matchId: "match-1",
  clubName: "Mill Green Athletic",
  clubColour: "#146C4A",
  clubIconUrl: null,
  teamName: "U11 Girls",
  seasonLabel: "2025/26",
  opponentName: "Riverside Rovers",
  dateLabel: "Sun 8 Mar 2026",
  homeAwayLabel: "Home",
  competitionLabel: "League",
  homeName: "U11 Girls",
  awayName: "Riverside Rovers",
  homeScore: 3,
  awayScore: 1,
  scoreLabel: "3–1",
  result: "W",
  story: "Three unanswered in the second half.",
  goalList: { kind: "none" },
  coachPotmLabel: null,
  playersPotmLabel: null,
  form: ["W", "D", "L", "W", "W"],
  caption: "U11 Girls 3–1 Riverside Rovers",
  fileName: "u11-girls-2026-03-08-vs-riverside-rovers.png",
};

/**
 * Renders through Satori for real. The route streams the ImageResponse, so a
 * layout error there surfaces as a broken pipe rather than a catchable throw —
 * this is the only place a bad postcard layout fails loudly.
 */
async function renderPostcard(payload: MatchPostcardPayload) {
  const response = new ImageResponse(
    createElement(MatchPostcardImage, { payload, crestSrc: null }),
    { width: POSTCARD_WIDTH, height: POSTCARD_HEIGHT },
  );
  return Buffer.from(await response.arrayBuffer());
}

const goalLists: Array<[string, PostcardGoalList]> = [
  ["no goals", { kind: "none" }],
  [
    "a full goal list",
    {
      kind: "full",
      rows: [
        { label: "Amara 7", isPenalty: false, assistLabel: "Niamh 4" },
        { label: "Priya 9", isPenalty: true, assistLabel: null },
        { label: "Own goal", isPenalty: false, assistLabel: null },
      ],
    },
  ],
  [
    "a compact goal list",
    {
      kind: "compact",
      rows: [
        { label: "Amara 7", isPenalty: false, assistLabel: "Niamh 4" },
        { label: "Priya 9", isPenalty: true, assistLabel: null },
      ],
    },
  ],
  [
    "a summary goal list",
    {
      kind: "summary",
      text: "Amara (7), Priya (9), Niamh (4)",
      extra: "and 4 others",
    },
  ],
];

describe("MatchPostcardImage", () => {
  it.each(goalLists)("renders a PNG with %s", async (_name, goalList) => {
    const png = await renderPostcard({ ...basePayload, goalList });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG with both player of the match awards", async () => {
    const png = await renderPostcard({
      ...basePayload,
      coachPotmLabel: "Amara (7)",
      playersPotmLabel: "Niamh (4)",
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG for a loss with no competition and an empty form", async () => {
    const png = await renderPostcard({
      ...basePayload,
      competitionLabel: null,
      clubColour: null,
      result: "L",
      scoreLabel: "0–2",
      form: [],
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });
});
