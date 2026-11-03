import { describe, expect, it } from "vitest";
import type { PlayerCountPoint } from "@/lib/data/stats";
import {
  buildCountViewRows,
  countMetricLabel,
  PERIOD_STARTS_METRIC_OPTIONS,
} from "@/lib/stats/count-view";

const sample: PlayerCountPoint[] = [
  {
    playerId: "1",
    personId: "person-1",
    name: "Ada Wing",
    count: 4,
    position: "WNG",
    matchesPlayed: 8,
    periodsPlayed: 10,
  },
  {
    playerId: "2",
    personId: "person-2",
    name: "Bea Fwd",
    count: 2,
    position: "FWD",
    matchesPlayed: 2,
    periodsPlayed: 0,
  },
  {
    playerId: "3",
    personId: "person-3",
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
          personId: "person-4",
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

describe("buildCountViewRows ordering", () => {
  it("orders by the plotted value by default", () => {
    const rows = buildCountViewRows(sample, ["ALL"], "per_game");
    expect(rows.map((row) => row.name)).toEqual([
      "Bea Fwd",
      "Cal None",
      "Ada Wing",
    ]);
  });

  it("orders by the total when asked, even in a per-game view", () => {
    const rows = buildCountViewRows(sample, ["ALL"], "per_game", "count");
    expect(rows.map((row) => [row.name, row.count])).toEqual([
      ["Cal None", 6],
      ["Ada Wing", 4],
      ["Bea Fwd", 2],
    ]);
    // The plotted value is still the rate.
    expect(rows.map((row) => row.value)).toEqual([1, 0.5, 1]);
  });

  it("breaks ties by name", () => {
    const tied = [
      { ...sample[0]!, name: "Zed", count: 3, matchesPlayed: 3 },
      { ...sample[1]!, name: "Amy", count: 3, matchesPlayed: 1 },
    ];
    expect(
      buildCountViewRows(tied, ["ALL"], "per_game", "count").map(
        (row) => row.name,
      ),
    ).toEqual(["Amy", "Zed"]);
  });
});

describe("PERIOD_STARTS_METRIC_OPTIONS", () => {
  it("offers Periods first, then Periods per game", () => {
    expect(PERIOD_STARTS_METRIC_OPTIONS).toEqual([
      { value: "total", label: "Periods" },
      { value: "per_game", label: "Periods per game" },
    ]);
  });
});
