import { describe, expect, it } from "vitest";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
} from "@/lib/stats/competition-filters";
import { filterResults } from "@/lib/stats/results-view";
import {
  formatGoalDifference,
  formatGoalsForAgainst,
  formatWdl,
  formatWdlAriaLabel,
  seasonTilesFromResults,
} from "@/lib/stats/season-tiles";

const results: ResultOverTimePoint[] = [
  {
    matchId: "m1",
    date: "2026-01-01",
    label: "Rivals",
    goalsFor: 2,
    goalsAgainst: 1,
    result: "W",
    competitionId: "c1",
    competitionKind: "league",
    competitionName: "League",
    isFriendly: false,
  },
  {
    matchId: "m2",
    date: "2026-01-08",
    label: "Town",
    goalsFor: 0,
    goalsAgainst: 0,
    result: "D",
    competitionId: "c2",
    competitionKind: "cup",
    competitionName: "Cup",
    isFriendly: false,
  },
  {
    matchId: "m3",
    date: "2026-01-15",
    label: "United",
    goalsFor: 1,
    goalsAgainst: 4,
    result: "L",
    competitionId: "c1",
    competitionKind: "league",
    competitionName: "League",
    isFriendly: false,
  },
];

describe("season tile labels", () => {
  it("joins W–D–L with en-dashes", () => {
    expect(formatWdl({ wins: 8, draws: 0, losses: 0 })).toBe("8–0–0");
  });

  it("names wins, draws, and losses in the W–D–L aria-label", () => {
    expect(formatWdlAriaLabel({ wins: 8, draws: 0, losses: 0 })).toBe(
      "8 wins, 0 draws, 0 losses",
    );
  });

  it("joins for–against with an en-dash", () => {
    expect(formatGoalsForAgainst({ goalsFor: 14, goalsAgainst: 5 })).toBe(
      "14–5",
    );
  });

  it("always includes a sign on goal difference", () => {
    expect(formatGoalDifference(14, 5)).toBe("+9");
    expect(formatGoalDifference(1, 3)).toBe("−2");
    expect(formatGoalDifference(2, 2)).toBe("+0");
  });
});

describe("seasonTilesFromResults", () => {
  it("hides tiles when there are no played matches", () => {
    expect(seasonTilesFromResults([])).toBeNull();
  });

  it("builds four tiles from played matches", () => {
    expect(seasonTilesFromResults(results)).toEqual([
      { label: "Played", value: "3" },
      {
        label: "W–D–L",
        value: "1–1–1",
        ariaLabel: "1 wins, 1 draws, 1 losses",
      },
      { label: "Goals", value: "3–5" },
      { label: "Goal difference", value: "−2" },
    ]);
  });

  it("follows competition filters", () => {
    const filtered = filterResults(results, "c1", ALL_COMPETITION_KINDS);
    expect(seasonTilesFromResults(filtered)).toEqual([
      { label: "Played", value: "2" },
      {
        label: "W–D–L",
        value: "1–0–1",
        ariaLabel: "1 wins, 0 draws, 1 losses",
      },
      { label: "Goals", value: "3–5" },
      { label: "Goal difference", value: "−2" },
    ]);
  });

  it("hides tiles when filters leave no played matches", () => {
    const filtered = filterResults(results, "missing", ALL_COMPETITION_KINDS);
    expect(seasonTilesFromResults(filtered)).toBeNull();
    expect(
      seasonTilesFromResults(
        filterResults(results, ALL_COMPETITIONS, ALL_COMPETITION_KINDS),
      ),
    ).not.toBeNull();
  });
});
