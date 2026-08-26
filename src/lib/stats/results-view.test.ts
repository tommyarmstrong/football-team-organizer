import { describe, expect, it } from "vitest";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import {
  cumulativeResults,
  filterResults,
  tallyGoals,
  tallyResults,
  withGoalDifference,
} from "@/lib/stats/results-view";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
} from "@/lib/stats/competition-filters";

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

describe("filterResults", () => {
  it("keeps every match when filters are all", () => {
    expect(
      filterResults(results, ALL_COMPETITIONS, ALL_COMPETITION_KINDS),
    ).toHaveLength(3);
  });

  it("filters by competition id", () => {
    expect(filterResults(results, "c1", ALL_COMPETITION_KINDS)).toHaveLength(2);
  });
});

describe("withGoalDifference", () => {
  it("subtracts goals against from goals for", () => {
    expect(
      withGoalDifference(results).map((row) => row.goalDifference),
    ).toEqual([1, 0, -3]);
  });
});

describe("tallyResults / tallyGoals", () => {
  it("counts outcomes and goals", () => {
    expect(tallyResults(results)).toEqual({ wins: 1, draws: 1, losses: 1 });
    expect(tallyGoals(results)).toEqual({ goalsFor: 3, goalsAgainst: 5 });
  });
});

describe("cumulativeResults", () => {
  it("accumulates wins, draws, and losses in match order", () => {
    expect(
      cumulativeResults(results).map((row) => [
        row.wins,
        row.draws,
        row.losses,
      ]),
    ).toEqual([
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ]);
  });
});
