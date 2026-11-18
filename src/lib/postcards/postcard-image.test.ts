import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageResponse } from "next/og";
import { describe, expect, it } from "vitest";
import {
  MatchPostcardImage,
  POSTCARD_BACKGROUND,
  POSTCARD_DETAIL_FONT_SIZE,
  POSTCARD_HEIGHT,
  POSTCARD_ICON_FONT_SIZE,
  POSTCARD_INK,
  POSTCARD_LIST_INDENT,
  POSTCARD_PITCH_OPACITY,
  POSTCARD_SCORE_FONT_SIZE,
  POSTCARD_SECTION_GAP,
  POSTCARD_TEAM_NAME_FONT_SIZE,
  POSTCARD_WIDTH,
  postcardGoalColumnCount,
  postcardPitchTop,
  splitPostcardGoalRows,
} from "@/lib/postcards/postcard-image";
import type {
  MatchPostcardPayload,
  PostcardGoalList,
  ScheduledMatchPostcardPayload,
} from "@/lib/postcards/types";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const basePayload: MatchPostcardPayload = {
  kind: "played",
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
  squadLines: ["1 Ali, 4 Dexter, 5 Theo, 6 Ceyone"],
  form: ["W", "D", "L", "W", "W"],
  caption: "U11 Girls 3–1 Riverside Rovers",
  fileName: "u11-girls-2026-03-08-vs-riverside-rovers.png",
};

/**
 * Renders through Satori for real. The route streams the ImageResponse, so a
 * layout error there surfaces as a broken pipe rather than a catchable throw —
 * this is the only place a bad postcard layout fails loudly.
 */
function postcardMarkup(payload: MatchPostcardPayload) {
  return renderToStaticMarkup(
    createElement(MatchPostcardImage, { payload, crestSrc: null }),
  );
}

function slotStyle(html: string, slot: string): string | null {
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`))?.[0];
  return tag?.match(/style="([^"]*)"/)?.[1] ?? null;
}

function styleFontSize(html: string, slot: string): number | null {
  const style = slotStyle(html, slot);
  const match = style?.match(/font-size:(\d+)px/);
  return match ? Number(match[1]) : null;
}

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
        { label: "Amara", isPenalty: false, assistLabel: "Niamh" },
        { label: "Priya", isPenalty: true, assistLabel: null },
        { label: "Own goal", isPenalty: false, assistLabel: null },
      ],
    },
  ],
  [
    "a compact goal list",
    {
      kind: "compact",
      rows: [
        { label: "Amara", isPenalty: false, assistLabel: "Niamh" },
        { label: "Priya", isPenalty: true, assistLabel: null },
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

describe("postcard goal columns", () => {
  it("keeps a short list in one column and splits a longer list in two", () => {
    expect(postcardGoalColumnCount(4)).toBe(1);
    expect(postcardGoalColumnCount(5)).toBe(2);
    expect(splitPostcardGoalRows(["a", "b", "c", "d"])).toEqual([
      ["a", "b", "c", "d"],
    ]);
    expect(splitPostcardGoalRows(["a", "b", "c", "d", "e"])).toEqual([
      ["a", "b", "c"],
      ["d", "e"],
    ]);
  });
});

describe("MatchPostcardImage layout", () => {
  it("uses the dark page background and light text", () => {
    const html = postcardMarkup(basePayload);
    expect(html).toContain(`background-color:${POSTCARD_BACKGROUND}`);
    expect(html).toContain(`color:${POSTCARD_INK}`);
  });

  it("puts the date above the teams and leaves out home or away", () => {
    const html = postcardMarkup(basePayload);
    const dateAt = html.indexOf('data-slot="postcard-date"');
    const scoreAt = html.indexOf('data-slot="postcard-score"');
    expect(dateAt).toBeGreaterThan(-1);
    expect(dateAt).toBeLessThan(scoreAt);
    expect(html.indexOf("Sun 8 Mar 2026")).toBeLessThan(
      html.indexOf("Riverside Rovers"),
    );
    expect(html).not.toContain(">Home<");
    expect(html).not.toContain(">Away<");
  });

  it("puts the date above the teams on a scheduled card", () => {
    const html = postcardMarkup({
      kind: "scheduled",
      matchId: "match-1",
      clubName: "Mill Green Athletic",
      clubColour: "#146C4A",
      clubIconUrl: null,
      teamName: "U11 Girls",
      seasonLabel: "2025/26",
      opponentName: "Riverside Rovers",
      dateLabel: "Sun 8 Mar 2026",
      homeAwayLabel: "Away",
      competitionLabel: "League",
      homeName: "Riverside Rovers",
      awayName: "U11 Girls",
      venueName: "Main Pitch",
      venueAddress: null,
      kickoffLabel: "10:00",
      meetupLabel: "09:30",
      squadLines: [],
      form: [],
      caption: "U11 Girls vs Riverside Rovers",
      fileName: "card.png",
    });
    const dateAt = html.indexOf('data-slot="postcard-date"');
    const namesAt = html.indexOf('data-slot="postcard-team-name"');
    expect(dateAt).toBeGreaterThan(-1);
    expect(dateAt).toBeLessThan(namesAt);
    expect(html).not.toContain(">Away<");
  });

  it("draws the score smaller than the team names", () => {
    expect(POSTCARD_SCORE_FONT_SIZE).toBeLessThan(POSTCARD_TEAM_NAME_FONT_SIZE);
    const html = postcardMarkup(basePayload);
    expect(styleFontSize(html, "postcard-score")).toBe(
      POSTCARD_SCORE_FONT_SIZE,
    );
    expect(styleFontSize(html, "postcard-team-name")).toBe(
      POSTCARD_TEAM_NAME_FONT_SIZE,
    );
  });

  it("matches scorer type to the awards and draws the icons at that size", () => {
    const html = postcardMarkup({
      ...basePayload,
      goalList: {
        kind: "full",
        rows: [{ label: "Amara", isPenalty: false, assistLabel: "Niamh" }],
      },
      coachPotmLabel: "Amara",
      playersPotmLabel: "Niamh",
    });
    expect(styleFontSize(html, "postcard-goal-label")).toBe(
      POSTCARD_DETAIL_FONT_SIZE,
    );
    expect(styleFontSize(html, "postcard-award")).toBe(
      POSTCARD_DETAIL_FONT_SIZE,
    );
    expect(styleFontSize(html, "postcard-icon")).toBe(POSTCARD_ICON_FONT_SIZE);
    expect(POSTCARD_ICON_FONT_SIZE).toBe(POSTCARD_DETAIL_FONT_SIZE);
    expect(html).toContain("⚽");
    expect(html).toContain("🏆");
    expect(html).toContain("🤝");
  });

  it("paints the competition in the same colour as the date", () => {
    const html = postcardMarkup(basePayload);
    const date = slotStyle(html, "postcard-date");
    const competition = slotStyle(html, "postcard-competition");
    expect(date).toContain("color:#a9b5b2");
    expect(competition).toContain("color:#a9b5b2");
  });

  it("indents goals and awards in from the left edge", () => {
    const html = postcardMarkup({
      ...basePayload,
      goalList: {
        kind: "full",
        rows: [{ label: "Amara", isPenalty: false, assistLabel: null }],
      },
      coachPotmLabel: "Amara",
    });
    expect(slotStyle(html, "postcard-goals")).toContain(
      `padding-left:${POSTCARD_LIST_INDENT}px`,
    );
    expect(slotStyle(html, "postcard-awards")).toContain(
      `padding-left:${POSTCARD_LIST_INDENT}px`,
    );
  });

  it("keeps the same gap above Matchday Squad", () => {
    const withAwards = postcardMarkup({
      ...basePayload,
      coachPotmLabel: "Amara",
      goalList: {
        kind: "full",
        rows: [{ label: "Amara", isPenalty: false, assistLabel: null }],
      },
    });
    const bare = postcardMarkup({
      ...basePayload,
      squadLines: ["1 Ali"],
      form: [],
      goalList: { kind: "none" },
    });
    const scheduled = postcardMarkup({
      kind: "scheduled",
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
      venueName: "Main Pitch",
      venueAddress: null,
      kickoffLabel: "10:00",
      meetupLabel: "09:30",
      squadLines: ["1 Ali"],
      form: ["W"],
      caption: "U11 Girls vs Riverside Rovers",
      fileName: "card.png",
    });
    const gap = `margin-top:${POSTCARD_SECTION_GAP}px`;
    expect(slotStyle(withAwards, "postcard-squad")).toContain(gap);
    expect(slotStyle(bare, "postcard-squad")).toContain(gap);
    expect(slotStyle(scheduled, "postcard-squad")).toContain(gap);
  });

  it("draws a faint pitch centred on the card", () => {
    expect(POSTCARD_PITCH_OPACITY).toBeLessThanOrEqual(0.45 * 0.25);
    expect(postcardPitchTop()).toBe((POSTCARD_HEIGHT - 1190) / 2);
    const style = slotStyle(postcardMarkup(basePayload), "postcard-pitch");
    expect(style).toContain(`opacity:${POSTCARD_PITCH_OPACITY}`);
    expect(style).toContain(`top:${postcardPitchTop()}px`);
    expect(style).toContain("left:0");
  });

  it("splits a long goal list into two columns", () => {
    const short = postcardMarkup({
      ...basePayload,
      goalList: {
        kind: "full",
        rows: [
          { label: "Amara", isPenalty: false, assistLabel: null },
          { label: "Priya", isPenalty: false, assistLabel: null },
        ],
      },
    });
    const long = postcardMarkup({
      ...basePayload,
      goalList: {
        kind: "full",
        rows: ["Amara", "Priya", "Niamh", "Luca", "Maya", "Owen"].map(
          (label) => ({
            label,
            isPenalty: false,
            assistLabel: null,
          }),
        ),
      },
    });
    expect(short).toContain('data-columns="1"');
    expect(long).toContain('data-columns="2"');
  });
});

describe("MatchPostcardImage", () => {
  it.each(goalLists)("renders a PNG with %s", async (_name, goalList) => {
    const png = await renderPostcard({ ...basePayload, goalList });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG when goals fill two columns", async () => {
    const png = await renderPostcard({
      ...basePayload,
      goalList: {
        kind: "full",
        rows: ["Amara", "Priya", "Niamh", "Luca", "Maya", "Owen"].map(
          (label) => ({
            label,
            isPenalty: false,
            assistLabel: "Sam",
          }),
        ),
      },
      coachPotmLabel: "Amara",
      playersPotmLabel: "Niamh",
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG with both player of the match awards", async () => {
    const png = await renderPostcard({
      ...basePayload,
      coachPotmLabel: "Amara",
      playersPotmLabel: "Niamh",
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

  it("renders a PNG for a scheduled fixture with venue and times", async () => {
    const scheduled: ScheduledMatchPostcardPayload = {
      kind: "scheduled",
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
      venueName: "Main Pitch",
      venueAddress: "1 Windmill Road, London, N18 1NB",
      kickoffLabel: "10:00",
      meetupLabel: "09:30",
      squadLines: ["1 Ali, 4 Dexter, 5 Theo, 6 Ceyone"],
      form: ["W", "D", "L", "W", "W"],
      caption: "U11 Girls vs Riverside Rovers",
      fileName: "u11-girls-2026-03-08-vs-riverside-rovers.png",
    };
    const png = await renderPostcard(scheduled);
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG for a scheduled fixture with TBC date, times, and venue", async () => {
    const scheduled: ScheduledMatchPostcardPayload = {
      kind: "scheduled",
      matchId: "match-1",
      clubName: "Mill Green Athletic",
      clubColour: "#146C4A",
      clubIconUrl: null,
      teamName: "U11 Girls",
      seasonLabel: "2025/26",
      opponentName: "Riverside Rovers",
      dateLabel: "TBC",
      homeAwayLabel: "Home",
      competitionLabel: "League",
      homeName: "U11 Girls",
      awayName: "Riverside Rovers",
      venueName: null,
      venueAddress: null,
      kickoffLabel: "TBC",
      meetupLabel: "TBC",
      squadLines: [],
      form: [],
      caption: "U11 Girls vs Riverside Rovers",
      fileName: "u11-girls-vs-riverside-rovers.png",
    };
    const png = await renderPostcard(scheduled);
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it("renders a PNG when only the venue address is set", async () => {
    const scheduled: ScheduledMatchPostcardPayload = {
      kind: "scheduled",
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
      venueName: null,
      venueAddress: "1 Windmill Road, London, N18 1NB",
      kickoffLabel: "10:00",
      meetupLabel: "TBC",
      squadLines: [],
      form: ["W"],
      caption: "U11 Girls vs Riverside Rovers",
      fileName: "u11-girls-2026-03-08-vs-riverside-rovers.png",
    };
    const png = await renderPostcard(scheduled);
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });
});
