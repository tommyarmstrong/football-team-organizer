import { describe, expect, it } from "vitest";
import {
  DONUT_CIRCUMFERENCE,
  donutSegments,
  pointSizes,
  REPORT_POINT_RADIUS,
  ringSegments,
  monthTicks,
  niceStep,
} from "@/lib/report/chart-math";
import {
  DEFAULT_REPORT_COLOUR,
  isLightColour,
  readableForeground,
  reportThemeVars,
  resolveReportColour,
} from "@/lib/report/colour";
import {
  chunk,
  chunkAtLeastOne,
  fillerPagesForEven,
  notesPageCount,
  splitMarkdownPages,
} from "@/lib/report/paginate";
import {
  sampleCoaches,
  sampleMatches,
  samplePlayers,
} from "@/lib/report/sample";
import {
  emptySeasonAwards,
  parseSeasonAwards,
  SEASON_AWARD_BOXES,
} from "@/lib/report/season-awards";
import {
  reportAwardsPath,
  reportSlotPath,
  reportSlug,
  slugify,
} from "@/lib/report/slug";
import {
  biggestWin,
  cleanSheets,
  cumulativePoints,
  pointsTooltip,
  displayScore,
  goalTotals,
  honourNames,
  leaders,
  longestUnbeaten,
  perMatch,
  sortSquad,
  tally,
  winPercentage,
} from "@/lib/report/summary";
import type { ReportMatch, ReportPlayer } from "@/lib/report/types";

function match(
  goalsFor: number,
  goalsAgainst: number,
  extra: Partial<ReportMatch> = {},
): ReportMatch {
  return {
    id: `${goalsFor}-${goalsAgainst}-${Math.random()}`,
    date: "2025-09-06",
    opponent: "Rivals",
    homeAway: "home",
    competitionId: null,
    competitionKind: null,
    competitionLabel: null,
    isFriendly: false,
    goalsFor,
    goalsAgainst,
    result: goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D",
    ...extra,
  };
}

function player(name: string, extra: Partial<ReportPlayer> = {}): ReportPlayer {
  return {
    id: name,
    name,
    firstName: name,
    card: {
      playerId: name,
      teamId: "t1",
      clubName: "Club",
      clubColour: null,
      clubIconUrl: null,
      teamName: "Team",
      ageGroup: "U10",
      seasonLabel: "2025/26",
      firstName: name,
      lastName: null,
      shirtNumber: null,
      positionLabel: null,
      stats: {
        appearances: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        potm: 0,
      },
    },
    shirtNumber: null,
    position: null,
    appearances: 0,
    goals: 0,
    assists: 0,
    playerOfTheMatch: 0,
    ...extra,
  };
}

describe("report colour", () => {
  it("falls back to the default green for missing or invalid colours", () => {
    expect(resolveReportColour(null)).toBe(DEFAULT_REPORT_COLOUR);
    expect(resolveReportColour("blue")).toBe(DEFAULT_REPORT_COLOUR);
    expect(resolveReportColour(" #1b4d3e ")).toBe("#1B4D3E");
  });

  it("picks white on dark colours and near-black on light ones", () => {
    expect(readableForeground("#1D3A8A")).toBe("#FFFFFF");
    expect(readableForeground("#FFD400")).toBe("#111814");
    // Favours white: mid-tones get white, bright/light colours stay black.
    expect(readableForeground("#FF4015")).toBe("#FFFFFF");
    expect(readableForeground("#F97316")).toBe("#111814");
    expect(readableForeground("#E85D04")).toBe("#FFFFFF");
    expect(readableForeground("#16A34A")).toBe("#FFFFFF");
    expect(readableForeground("#FF8C00")).toBe("#111814");
    expect(readableForeground("#FFA500")).toBe("#111814");
  });

  it("flags light colours so text on white paper is darkened", () => {
    expect(isLightColour("#FFD400")).toBe(true);
    expect(isLightColour("#1D3A8A")).toBe(false);
    expect(reportThemeVars("#FFD400")["--club-ink"]).toContain("color-mix");
    expect(reportThemeVars("#1D3A8A")["--club-ink"]).toBe("#1D3A8A");
  });

  it("exposes every variable the report CSS uses", () => {
    expect(Object.keys(reportThemeVars("#1D3A8A")).sort()).toEqual([
      "--club",
      "--club-deep",
      "--club-fg",
      "--club-ink",
      "--club-line",
      "--club-soft",
    ]);
  });
});

describe("pagination", () => {
  it("chunks rows into pages", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
    expect(() => chunk([1], 0)).toThrow();
  });

  it("always yields at least one page", () => {
    expect(chunkAtLeastOne([], 3)).toEqual([[]]);
    expect(chunkAtLeastOne([1], 3)).toEqual([[1]]);
  });

  it("adds a filler page only for odd page counts", () => {
    expect(fillerPagesForEven(11)).toBe(1);
    expect(fillerPagesForEven(12)).toBe(0);
  });

  it("always adds a Notes page, and keeps the whole book even", () => {
    // body + notes + blank inside back cover + back cover must come to an
    // even number of pages.
    for (let body = 1; body <= 40; body += 1) {
      const notes = notesPageCount(body);
      expect(notes).toBeGreaterThanOrEqual(1);
      expect(notes).toBeLessThanOrEqual(2);
      expect((body + notes + 2) % 2).toBe(0);
    }
    expect(notesPageCount(10)).toBe(2);
    expect(notesPageCount(11)).toBe(1);
  });

  it("splits markdown on page markers and drops empty pages", () => {
    const md =
      "One\n\n<!-- page -->\n\nTwo\n\n  <!--page-->  \n\n<!-- page -->\n\nThree\n";
    expect(splitMarkdownPages(md)).toEqual(["One", "Two", "Three"]);
    expect(splitMarkdownPages("No marker")).toEqual(["No marker"]);
    expect(splitMarkdownPages("")).toEqual([]);
  });

  it("does not treat an inline marker as a page break", () => {
    expect(splitMarkdownPages("a <!-- page --> b")).toEqual([
      "a <!-- page --> b",
    ]);
  });
});

describe("report slug", () => {
  it("slugifies names and season labels", () => {
    expect(slugify("U10 Lions")).toBe("u10-lions");
    expect(slugify("Café  Rovers!")).toBe("cafe-rovers");
    expect(reportSlug({ name: "U10 Lions", season_label: "2025/26" })).toBe(
      "u10-lions-2025-26",
    );
  });

  it("builds the repo path shown by placeholders", () => {
    expect(reportSlotPath("u10-lions-2025-26", "coachNotes")).toBe(
      "content/reports/u10-lions-2025-26/coach-notes.md",
    );
  });
});

describe("season awards", () => {
  const path = "content/reports/x/season-awards.json";

  it("builds the path shown for the awards file", () => {
    expect(reportAwardsPath("u10-lions-2025-26")).toBe(
      "content/reports/u10-lions-2025-26/season-awards.json",
    );
  });

  it("lists the three awards in print order", () => {
    expect(SEASON_AWARD_BOXES.map((b) => b.title)).toEqual([
      "Player of the season",
      "Player's player of the season",
      "Most improved player of the season",
    ]);
  });

  it("reads the winners", () => {
    expect(
      parseSeasonAwards(
        JSON.stringify({
          playerOfTheSeason: " Isaac ",
          playersPlayer: "Finn",
          mostImproved: "George",
        }),
        path,
      ),
    ).toEqual({
      expectedPath: path,
      playerOfTheSeason: "Isaac",
      playersPlayer: "Finn",
      mostImproved: "George",
    });
  });

  it("leaves awards with no winner blank", () => {
    expect(
      parseSeasonAwards(
        JSON.stringify({ playerOfTheSeason: "Isaac", playersPlayer: "  " }),
        path,
      ),
    ).toEqual({
      ...emptySeasonAwards(path),
      playerOfTheSeason: "Isaac",
    });
  });

  it("ignores bad JSON and wrong types instead of failing", () => {
    expect(parseSeasonAwards("{ nope", path)).toEqual(emptySeasonAwards(path));
    expect(parseSeasonAwards("[1, 2]", path)).toEqual(emptySeasonAwards(path));
    expect(parseSeasonAwards("null", path)).toEqual(emptySeasonAwards(path));
    expect(
      parseSeasonAwards(JSON.stringify({ playerOfTheSeason: 7 }), path),
    ).toEqual(emptySeasonAwards(path));
  });
});

describe("season summary", () => {
  const matches = [
    match(3, 0),
    match(1, 1),
    match(0, 2),
    match(2, 1),
    match(5, 0),
  ];

  it("tallies results and goals", () => {
    expect(tally(matches)).toEqual({ wins: 3, draws: 1, losses: 1 });
    expect(goalTotals(matches)).toEqual({ goalsFor: 11, goalsAgainst: 4 });
    expect(winPercentage(tally(matches))).toBe(60);
    expect(winPercentage({ wins: 0, draws: 0, losses: 0 })).toBe(0);
  });

  it("counts clean sheets and the longest unbeaten run", () => {
    expect(cleanSheets(matches)).toBe(2);
    expect(longestUnbeaten(matches)).toBe(2);
    expect(longestUnbeaten([])).toBe(0);
  });

  it("accumulates points: 3 for a win, 1 for a draw", () => {
    expect(cumulativePoints(matches)).toEqual([3, 4, 4, 7, 10]);
  });

  it("finds the biggest win, preferring more goals on equal margins", () => {
    const result = biggestWin([match(2, 0), match(3, 1), match(5, 0)]);
    expect(result?.goalsFor).toBe(5);
    expect(biggestWin([match(2, 0), match(3, 1)])?.goalsFor).toBe(3);
    expect(biggestWin([match(0, 1)])).toBeNull();
  });

  it("prints the home side's score first, and ours first at a neutral ground", () => {
    expect(displayScore(match(3, 1, { homeAway: "home" }))).toEqual({
      first: 3,
      second: 1,
    });
    // Away: the opposition are at home, so their goals come first.
    expect(displayScore(match(3, 1, { homeAway: "away" }))).toEqual({
      first: 1,
      second: 3,
    });
    expect(displayScore(match(0, 2, { homeAway: "away" }))).toEqual({
      first: 2,
      second: 0,
    });
    expect(displayScore(match(3, 1, { homeAway: "neutral" }))).toEqual({
      first: 3,
      second: 1,
    });
  });

  it("formats goals per match", () => {
    expect(perMatch(11, 5)).toBe("2.2");
    expect(perMatch(0, 0)).toBe("0.0");
  });
});

describe("leaders", () => {
  const squad = [
    player("Ann", { goals: 5 }),
    player("Bea", { goals: 3 }),
    player("Cal", { goals: 3 }),
    player("Dee", { goals: 3 }),
    player("Eve", { goals: 1 }),
    player("Fay", { goals: 0 }),
  ];

  it("never lists players on zero", () => {
    expect(leaders(squad, (p) => p.goals, 10).map((l) => l.name)).toEqual([
      "Ann",
      "Bea",
      "Cal",
      "Dee",
      "Eve",
    ]);
  });

  it("keeps everyone tied with the last place", () => {
    expect(leaders(squad, (p) => p.goals, 2).map((l) => l.name)).toEqual([
      "Ann",
      "Bea",
      "Cal",
      "Dee",
    ]);
  });

  it("returns all joint leaders for a limit of one", () => {
    const joint = [player("A", { goals: 4 }), player("B", { goals: 4 })];
    expect(leaders(joint, (p) => p.goals, 1)).toHaveLength(2);
  });

  it("shortens long lists of joint winners", () => {
    expect(honourNames([])).toBe("—");
    expect(honourNames(["A", "B"])).toBe("A, B");
    expect(honourNames(["A", "B", "C", "D"])).toBe("A, B +2 more");
  });

  it("sorts the squad by shirt number with unnumbered players last", () => {
    const sorted = sortSquad([
      player("Zed"),
      player("Bob", { shirtNumber: 9 }),
      player("Al", { shirtNumber: 2 }),
      player("Abe"),
    ]);
    expect(sorted.map((p) => p.name)).toEqual(["Al", "Bob", "Abe", "Zed"]);
  });
});

describe("chart maths", () => {
  it("lays donut segments end to end around the circle", () => {
    const segments = donutSegments({ wins: 2, draws: 1, losses: 1 }, 0);
    expect(segments.map((s) => s.key)).toEqual(["W", "D", "L"]);
    const total = segments.reduce((sum, s) => sum + s.length, 0);
    expect(total).toBeCloseTo(DONUT_CIRCUMFERENCE, 5);
    expect(segments[1]!.offset).toBeCloseTo(DONUT_CIRCUMFERENCE / 2, 5);
  });

  it("omits empty segments and uses no gap for a single colour", () => {
    const only = donutSegments({ wins: 4, draws: 0, losses: 0 });
    expect(only).toHaveLength(1);
    expect(only[0]!.length).toBeCloseTo(DONUT_CIRCUMFERENCE, 5);
    expect(donutSegments({ wins: 0, draws: 0, losses: 0 })).toEqual([]);
  });

  it("lays any number of ring segments end to end, in order", () => {
    const segments = ringSegments(
      [
        { key: "for", count: 3 },
        { key: "against", count: 1 },
      ],
      0,
    );
    expect(segments.map((s) => s.key)).toEqual(["for", "against"]);
    expect(segments[0]!.length).toBeCloseTo(DONUT_CIRCUMFERENCE * 0.75, 5);
    expect(segments[1]!.offset).toBeCloseTo(DONUT_CIRCUMFERENCE * 0.75, 5);
    expect(ringSegments([{ key: "for", count: 0 }])).toEqual([]);
  });

  it("keeps the report's point size unless asked for bigger", () => {
    expect(pointSizes(20, 648).radius).toBe(REPORT_POINT_RADIUS);
    expect(pointSizes(20, 648, 8).radius).toBe(8);
  });

  it("shrinks big points only when neighbours would touch, never below the report size", () => {
    // 40 matches: 16.6 units apart, so 8 would crowd; 0.42 of the gap is kept.
    const crowded = pointSizes(40, 648, 8);
    expect(crowded.radius).toBeGreaterThan(REPORT_POINT_RADIUS);
    expect(crowded.radius).toBeLessThan(8);
    expect(crowded.radius * 2).toBeLessThanOrEqual(648 / 39);
    // 200 matches: far too many, so fall back to the report size.
    expect(pointSizes(200, 648, 8).radius).toBe(REPORT_POINT_RADIUS);
  });

  it("makes the hover target bigger than the point but not overlapping the next", () => {
    const roomy = pointSizes(12, 648, 8);
    expect(roomy.hit).toBeGreaterThan(roomy.radius);
    const gap = 648 / 11;
    expect(roomy.hit).toBeLessThanOrEqual(gap / 2);
    const single = pointSizes(1, 648, 8);
    expect(single.radius).toBe(8);
    expect(single.hit).toBeGreaterThan(8);
  });

  it("marks where each month starts", () => {
    const ticks = monthTicks([
      match(1, 0, { date: "2025-09-06" }),
      match(1, 0, { date: "2025-09-20" }),
      match(1, 0, { date: "2025-10-04" }),
    ]);
    expect(ticks).toEqual([
      { index: 0, label: "Sep" },
      { index: 2, label: "Oct" },
    ]);
  });

  it("chooses readable y-axis steps", () => {
    expect(niceStep(5)).toBe(1);
    expect(niceStep(10)).toBe(2);
    expect(niceStep(24)).toBe(5);
    expect(niceStep(48)).toBe(10);
    expect(niceStep(80)).toBe(20);
  });
});

describe("sample data", () => {
  it("is a consistent fabricated season", () => {
    const matches = sampleMatches();
    expect(matches.length).toBeGreaterThan(10);
    for (const m of matches) {
      const expected =
        m.goalsFor > m.goalsAgainst
          ? "W"
          : m.goalsFor < m.goalsAgainst
            ? "L"
            : "D";
      expect(m.result).toBe(expected);
    }
    expect(samplePlayers().some((p) => p.shirtNumber === null)).toBe(true);
  });

  it("uses first names only for players and card names", () => {
    for (const p of samplePlayers()) {
      expect(p.name).toBe(p.firstName);
      expect(p.name).not.toContain(" ");
      expect(p.card.lastName).toBeNull();
    }
  });

  it("keeps coaches' full names", () => {
    expect(sampleCoaches().map((c) => c.name)).toContain("Sam Whitfield");
  });
});

describe("pointsTooltip", () => {
  it("names the match, the score and the points so far", () => {
    expect(
      pointsTooltip(
        {
          id: "m",
          date: "2026-09-06",
          opponent: "Rovers",
          goalsFor: 3,
          goalsAgainst: 1,
          result: "W",
        },
        7,
      ),
    ).toMatch(/vs Rovers: W 3–1 · 7 pts$/);
  });
});
