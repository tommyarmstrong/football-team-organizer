import { describe, expect, it } from "vitest";
import type { GoalsByPlayerPoint } from "@/lib/data/stats";
import {
  buildGoalsViewRows,
  filterGoalsByPositions,
  formatGoalsMetricValue,
  goalsMetricValue,
  toggleGoalsPositionFilter,
} from "@/lib/stats/goals-view";

const sample: GoalsByPlayerPoint[] = [
  {
    playerId: "1",
    name: "Ada Mid",
    goals: 6,
    position: "MID",
    matchesPlayed: 3,
    periodsPlayed: 6,
    goalCompetitions: Array.from({ length: 6 }, () => ({
      competitionId: "c1",
      competitionKind: "league" as const,
      isFriendly: false,
    })),
  },
  {
    playerId: "2",
    name: "Bea Fwd",
    goals: 4,
    position: "FWD",
    matchesPlayed: 4,
    periodsPlayed: 8,
    goalCompetitions: Array.from({ length: 4 }, () => ({
      competitionId: "c1",
      competitionKind: "cup" as const,
      isFriendly: false,
    })),
  },
  {
    playerId: "3",
    name: "Cal Def",
    goals: 2,
    position: "DEF",
    matchesPlayed: 0,
    periodsPlayed: 0,
    goalCompetitions: Array.from({ length: 2 }, () => ({
      competitionId: null,
      competitionKind: null,
      isFriendly: false,
    })),
  },
  {
    playerId: "4",
    name: "Dee None",
    goals: 1,
    position: null,
    matchesPlayed: 2,
    periodsPlayed: 4,
    goalCompetitions: [
      {
        competitionId: null,
        competitionKind: null,
        isFriendly: true,
      },
    ],
  },
];

describe("toggleGoalsPositionFilter", () => {
  it("resets to ALL when ALL is chosen", () => {
    expect(toggleGoalsPositionFilter(["DEF", "MID"], "ALL")).toEqual(["ALL"]);
  });

  it("replaces ALL with a position", () => {
    expect(toggleGoalsPositionFilter(["ALL"], "FWD")).toEqual(["FWD"]);
  });

  it("allows multiple positions", () => {
    expect(toggleGoalsPositionFilter(["DEF"], "MID")).toEqual(["MID", "DEF"]);
  });

  it("falls back to ALL when the last position is cleared", () => {
    expect(toggleGoalsPositionFilter(["GK"], "GK")).toEqual(["ALL"]);
  });
});

describe("filterGoalsByPositions", () => {
  it("returns everyone for ALL", () => {
    expect(filterGoalsByPositions(sample, ["ALL"])).toHaveLength(4);
  });

  it("keeps any selected position", () => {
    const rows = filterGoalsByPositions(sample, ["DEF", "MID"]);
    expect(rows.map((row) => row.name)).toEqual(["Ada Mid", "Cal Def"]);
  });

  it("excludes players without a matching position", () => {
    expect(filterGoalsByPositions(sample, ["GK"])).toEqual([]);
  });
});

describe("goalsMetricValue", () => {
  it("returns totals and rates", () => {
    const row = sample[0]!;
    expect(goalsMetricValue(row, "total")).toBe(6);
    expect(goalsMetricValue(row, "per_game")).toBe(2);
    expect(goalsMetricValue(row, "per_period")).toBe(1);
  });

  it("returns null when a rate denominator is zero", () => {
    const row = sample[2]!;
    expect(goalsMetricValue(row, "per_game")).toBeNull();
    expect(goalsMetricValue(row, "per_period")).toBeNull();
  });
});

describe("buildGoalsViewRows", () => {
  it("formats and sorts by the selected metric", () => {
    const rows = buildGoalsViewRows(sample, ["ALL"], "per_game");
    expect(rows.map((row) => row.displayValue)).toEqual([
      "2.00",
      "1.00",
      "0.50",
    ]);
    expect(rows.map((row) => row.name)).toEqual([
      "Ada Mid",
      "Bea Fwd",
      "Dee None",
    ]);
  });

  it("always includes goals and goals-per-game table values", () => {
    const rows = buildGoalsViewRows(sample, ["ALL"], "total");
    expect(rows[0]).toMatchObject({
      name: "Ada Mid",
      goalsDisplay: "6",
      goalsPerGameDisplay: "2.00",
    });
    expect(rows.find((row) => row.name === "Cal Def")).toMatchObject({
      goalsDisplay: "2",
      goalsPerGameDisplay: "—",
    });
  });
});

describe("formatGoalsMetricValue", () => {
  it("formats totals as integers and rates to two decimals", () => {
    expect(formatGoalsMetricValue(3, "total")).toBe("3");
    expect(formatGoalsMetricValue(1.5, "per_game")).toBe("1.50");
    expect(formatGoalsMetricValue(null, "per_period")).toBe("—");
  });
});
