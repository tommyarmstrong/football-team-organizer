import { describe, expect, it } from "vitest";
import type { PlayerCountPoint } from "@/lib/data/stats";
import { buildCountViewRows, countMetricLabel } from "@/lib/stats/count-view";

const sample: PlayerCountPoint[] = [
  {
    playerId: "1",
    name: "Ada Wing",
    count: 4,
    position: "WNG",
    matchesPlayed: 8,
    periodsPlayed: 10,
  },
  {
    playerId: "2",
    name: "Bea Fwd",
    count: 2,
    position: "FWD",
    matchesPlayed: 2,
    periodsPlayed: 0,
  },
  {
    playerId: "3",
    name: "Cal None",
    count: 6,
    position: null,
    matchesPlayed: 6,
    periodsPlayed: 6,
  },
];

describe("countMetricLabel", () => {
  it("labels totals and rates with the section noun", () => {
    expect(countMetricLabel("total", "Assists")).toBe("Assists");
    expect(countMetricLabel("per_game", "Assists")).toBe("Assists / game");
    expect(countMetricLabel("per_period", "Matches")).toBe("Matches / period");
  });
});

describe("buildCountViewRows", () => {
  it("keeps every player for ALL and sorts by the total", () => {
    const rows = buildCountViewRows(sample, ["ALL"], "total");
    expect(rows.map((row) => row.name)).toEqual([
      "Cal None",
      "Ada Wing",
      "Bea Fwd",
    ]);
    expect(rows.map((row) => row.value)).toEqual([6, 4, 2]);
  });

  it("filters to the selected positions", () => {
    const rows = buildCountViewRows(sample, ["WNG", "FWD"], "total");
    expect(rows.map((row) => row.name)).toEqual(["Ada Wing", "Bea Fwd"]);
  });

  it("uses appearances as the per-game denominator", () => {
    const rows = buildCountViewRows(sample, ["WNG"], "per_game");
    expect(rows).toEqual([
      expect.objectContaining({ name: "Ada Wing", value: 0.5, count: 4 }),
    ]);
  });

  it("drops players with no periods from the per-period view", () => {
    const rows = buildCountViewRows(sample, ["ALL"], "per_period");
    expect(rows.map((row) => row.name)).toEqual(["Cal None", "Ada Wing"]);
    expect(rows.map((row) => row.value)).toEqual([1, 0.4]);
  });

  it("treats a missing appearance count as the total for per game", () => {
    const rows = buildCountViewRows(
      [
        {
          playerId: "4",
          name: "Dee Apps",
          count: 5,
          position: "DEF",
          periodsPlayed: 10,
        },
      ],
      ["DEF"],
      "per_game",
    );
    expect(rows[0]?.value).toBe(1);
  });
});
