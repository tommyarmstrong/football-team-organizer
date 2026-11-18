import { describe, expect, it } from "vitest";
import type { GoalsByPlayerPoint, PlayerCountPoint } from "@/lib/data/stats";
import {
  ATTACKING_METRIC_OPTIONS,
  attackingUnit,
  buildAttackingViewRows,
} from "@/lib/stats/attacking-view";

const goals: GoalsByPlayerPoint[] = [
  {
    playerId: "1",
    personId: "person-1",
    name: "Ada Mid",
    goals: 4,
    position: "MID",
    matchesPlayed: 8,
    periodsPlayed: 12,
    goalCompetitions: [],
  },
  {
    playerId: "2",
    personId: "person-2",
    name: "Bea Fwd",
    goals: 2,
    position: "FWD",
    matchesPlayed: 4,
    periodsPlayed: 6,
    goalCompetitions: [],
  },
  {
    playerId: "3",
    personId: "person-3",
    name: "Cal Gk",
    goals: 1,
    position: "GK",
    matchesPlayed: 0,
    periodsPlayed: 0,
    goalCompetitions: [],
  },
];

const assists: PlayerCountPoint[] = [
  {
    playerId: "1",
    personId: "person-1",
    name: "Ada Mid",
    count: 2,
    position: "MID",
    matchesPlayed: 8,
    periodsPlayed: 12,
  },
  {
    playerId: "4",
    personId: "person-4",
    name: "Dee Wing",
    count: 5,
    position: "WNG",
    matchesPlayed: 5,
    periodsPlayed: 10,
  },
];

describe("buildAttackingViewRows", () => {
  it("sorts goals by the total", () => {
    const rows = buildAttackingViewRows(
      goals,
      assists,
      ["ALL"],
      "goals",
      "total",
    );
    expect(rows.map((row) => row.name)).toEqual([
      "Ada Mid",
      "Bea Fwd",
      "Cal Gk",
    ]);
    expect(rows.map((row) => row.value)).toEqual([4, 2, 1]);
  });

  it("adds goals and assists for G+A and sorts by that sum", () => {
    const rows = buildAttackingViewRows(
      goals,
      assists,
      ["ALL"],
      "involvements",
      "total",
    );
    expect(rows.map((row) => [row.name, row.count])).toEqual([
      ["Ada Mid", 6],
      ["Dee Wing", 5],
      ["Bea Fwd", 2],
      ["Cal Gk", 1],
    ]);
  });

  it("leaves a player with only assists out of the goals list", () => {
    const rows = buildAttackingViewRows(
      goals,
      assists,
      ["ALL"],
      "goals",
      "total",
    );
    expect(rows.map((row) => row.name)).not.toContain("Dee Wing");
  });

  it("uses appearances as the per-game denominator", () => {
    const rows = buildAttackingViewRows(
      goals,
      assists,
      ["ALL"],
      "involvements",
      "per_game",
    );
    expect(rows.find((row) => row.name === "Ada Mid")).toMatchObject({
      count: 6,
      value: 0.75,
    });
    expect(rows.find((row) => row.name === "Dee Wing")?.value).toBe(1);
  });

  it("uses periods played as the per-period denominator", () => {
    const rows = buildAttackingViewRows(
      goals,
      assists,
      ["MID"],
      "goals",
      "per_period",
    );
    expect(rows).toEqual([
      expect.objectContaining({ name: "Ada Mid", value: 4 / 12 }),
    ]);
  });

  it("drops players with no games or periods from a rate", () => {
    const perGame = buildAttackingViewRows(
      goals,
      assists,
      ["GK"],
      "goals",
      "per_game",
    );
    const perPeriod = buildAttackingViewRows(
      goals,
      assists,
      ["GK"],
      "goals",
      "per_period",
    );
    expect(perGame).toEqual([]);
    expect(perPeriod).toEqual([]);
  });

  it("applies the position filter to goals, assists and G+A", () => {
    expect(
      buildAttackingViewRows(goals, assists, ["WNG"], "assists", "total").map(
        (row) => row.name,
      ),
    ).toEqual(["Dee Wing"]);
    expect(
      buildAttackingViewRows(
        goals,
        assists,
        ["FWD"],
        "involvements",
        "total",
      ).map((row) => row.name),
    ).toEqual(["Bea Fwd"]);
  });
});

describe("ATTACKING_METRIC_OPTIONS", () => {
  it("offers total and per game", () => {
    expect(ATTACKING_METRIC_OPTIONS.map((option) => option.label)).toEqual([
      "Total",
      "Per game",
    ]);
    expect(
      ATTACKING_METRIC_OPTIONS.map((option) => option.value),
    ).not.toContain("per_period");
  });
});

describe("attackingUnit", () => {
  it("names the plotted total and the two rates", () => {
    expect(attackingUnit("goals", "total")).toBe("goals");
    expect(attackingUnit("assists", "per_game")).toBe("assists / game");
    expect(attackingUnit("involvements", "per_period")).toBe("g+a / period");
  });
});
