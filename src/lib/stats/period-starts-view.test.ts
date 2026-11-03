import { describe, expect, it } from "vitest";
import type { PeriodEvent, PlayerCountPoint } from "@/lib/data/stats";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
} from "@/lib/stats/competition-filters";
import {
  buildPeriodStartsViewRows,
  DEFAULT_PERIOD_TYPE_FILTER,
  filterPeriodStarts,
  formatPeriodsPerGamePercent,
  PERIOD_TYPE_FILTER_OPTIONS,
  periodsPerGamePercent,
} from "@/lib/stats/period-starts-view";

const league = {
  competitionId: "league-1",
  competitionKind: "league" as const,
  isFriendly: false,
};
const cup = {
  competitionId: "cup-1",
  competitionKind: "cup" as const,
  isFriendly: false,
};
const friendly = {
  competitionId: null,
  competitionKind: null,
  isFriendly: true,
};

function periods(
  competition: typeof league | typeof cup | typeof friendly,
  ...types: PeriodEvent["periodType"][]
): PeriodEvent[] {
  return types.map((periodType) => ({ ...competition, periodType }));
}

/**
 * Ada: 2 league games (4 quarters, then 2 halves + extra time) and a friendly
 * (4 quarters). She started 3 league quarters, a league half and 1 friendly
 * quarter. Bea: one cup game of halves, started both. Cal: only a friendly.
 */
const ada: PlayerCountPoint = {
  playerId: "1",
  personId: "person-1",
  name: "Ada Wing",
  count: 5,
  position: "WNG",
  events: [
    ...periods(league, "quarters", "quarters", "quarters", "halves"),
    ...periods(friendly, "quarters"),
  ],
  periodsInGames: [
    ...periods(league, "quarters", "quarters", "quarters", "quarters"),
    ...periods(league, "halves", "halves", "extra_time"),
    ...periods(friendly, "quarters", "quarters", "quarters", "quarters"),
  ],
};
const bea: PlayerCountPoint = {
  playerId: "2",
  personId: "person-2",
  name: "Bea Def",
  count: 2,
  position: "DEF",
  events: periods(cup, "halves", "halves"),
  periodsInGames: periods(cup, "halves", "halves"),
};
const cal: PlayerCountPoint = {
  playerId: "3",
  personId: "person-3",
  name: "Cal Keeper",
  count: 1,
  position: "GK",
  events: periods(friendly, "other"),
  periodsInGames: periods(friendly, "other", "other"),
};
const data = [ada, bea, cal];

function summary(rows: PlayerCountPoint[]) {
  return rows.map((row) => [row.name, row.count, row.periodsAvailable]);
}

describe("period type filter options", () => {
  it("offers All, Quarters, Halves and Extra time, defaulting to All", () => {
    expect(PERIOD_TYPE_FILTER_OPTIONS).toEqual([
      { value: "all", label: "All" },
      { value: "quarters", label: "Quarters" },
      { value: "halves", label: "Halves" },
      { value: "extra_time", label: "Extra time" },
    ]);
    expect(DEFAULT_PERIOD_TYPE_FILTER).toBe("all");
  });
});

describe("periodsPerGamePercent", () => {
  it("is the periods started as a percent of the periods available", () => {
    expect(periodsPerGamePercent(3, 4)).toBe(75);
    expect(periodsPerGamePercent(0, 4)).toBe(0);
    expect(periodsPerGamePercent(4, 4)).toBe(100);
  });

  it("is null when there are no periods to measure against", () => {
    expect(periodsPerGamePercent(2, 0)).toBeNull();
  });

  it("formats to one decimal place with a % sign, or a dash", () => {
    expect(formatPeriodsPerGamePercent(200 / 3)).toBe("66.7%");
    expect(formatPeriodsPerGamePercent(50)).toBe("50.0%");
    expect(formatPeriodsPerGamePercent(null)).toBe("—");
  });
});

describe("filterPeriodStarts", () => {
  it("counts every start and period for All, most starts first", () => {
    const rows = filterPeriodStarts(
      data,
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "all",
    );
    expect(summary(rows)).toEqual([
      ["Ada Wing", 5, 11],
      ["Bea Def", 2, 2],
      ["Cal Keeper", 1, 2],
    ]);
  });

  it("only counts quarters for the Quarters type, in starts and periods", () => {
    const rows = filterPeriodStarts(
      data,
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "quarters",
    );
    expect(summary(rows)).toEqual([["Ada Wing", 4, 8]]);
  });

  it("only counts halves for the Halves type, dropping players who started none", () => {
    const rows = filterPeriodStarts(
      data,
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "halves",
    );
    expect(summary(rows)).toEqual([
      ["Bea Def", 2, 2],
      ["Ada Wing", 1, 2],
    ]);
  });

  it("leaves everyone out for Extra time when nobody started one", () => {
    expect(
      filterPeriodStarts(
        data,
        ALL_COMPETITIONS,
        ALL_COMPETITION_KINDS,
        "extra_time",
      ),
    ).toEqual([]);
  });

  it("counts extra time starts against the extra time periods in the player's games", () => {
    const withExtraTime: PlayerCountPoint = {
      ...ada,
      events: [...(ada.events ?? []), ...periods(league, "extra_time")],
    };
    const [row] = filterPeriodStarts(
      [withExtraTime],
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "extra_time",
    );
    expect(row).toMatchObject({ count: 1, periodsAvailable: 1 });
  });

  it("applies the competition type filter to starts and periods", () => {
    const rows = filterPeriodStarts(data, ALL_COMPETITIONS, "league", "all");
    expect(summary(rows)).toEqual([["Ada Wing", 4, 7]]);
  });

  it("applies the competition filter and the type together", () => {
    const rows = filterPeriodStarts(
      data,
      "league-1",
      ALL_COMPETITION_KINDS,
      "quarters",
    );
    expect(summary(rows)).toEqual([["Ada Wing", 3, 4]]);
  });

  it("applies the competition filter alone", () => {
    const rows = filterPeriodStarts(
      data,
      "cup-1",
      ALL_COMPETITION_KINDS,
      "all",
    );
    expect(summary(rows)).toEqual([["Bea Def", 2, 2]]);
  });

  it("counts periods of other types (e.g. single period) only for All", () => {
    for (const type of ["quarters", "halves", "extra_time"] as const) {
      const names = filterPeriodStarts(
        [cal],
        ALL_COMPETITIONS,
        ALL_COMPETITION_KINDS,
        type,
      ).map((row) => row.name);
      expect(names).toEqual([]);
    }
    expect(
      filterPeriodStarts([cal], ALL_COMPETITIONS, ALL_COMPETITION_KINDS, "all"),
    ).toHaveLength(1);
  });

  it("treats a player with no periods list as having no periods available", () => {
    const [row] = filterPeriodStarts(
      [{ ...bea, periodsInGames: undefined }],
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "all",
    );
    expect(row?.periodsAvailable).toBe(0);
  });

  it("does not change the data it is given", () => {
    filterPeriodStarts(data, ALL_COMPETITIONS, "league", "quarters");
    expect(ada.count).toBe(5);
    expect(ada.events).toHaveLength(5);
  });
});

describe("buildPeriodStartsViewRows", () => {
  const filtered = filterPeriodStarts(
    data,
    ALL_COMPETITIONS,
    ALL_COMPETITION_KINDS,
    "all",
  );

  it("plots the periods started in the Periods view", () => {
    const rows = buildPeriodStartsViewRows(filtered, ["ALL"], "total");
    expect(rows.map((row) => [row.name, row.value])).toEqual([
      ["Ada Wing", 5],
      ["Bea Def", 2],
      ["Cal Keeper", 1],
    ]);
  });

  it("plots the percent of the periods in the player's games in the Periods per game view", () => {
    const rows = buildPeriodStartsViewRows(filtered, ["ALL"], "per_game");
    expect(rows.map((row) => [row.name, row.value.toFixed(1)])).toEqual([
      ["Ada Wing", "45.5"],
      ["Bea Def", "100.0"],
      ["Cal Keeper", "50.0"],
    ]);
  });

  it("keeps the rows ordered by periods started in both views", () => {
    for (const metric of ["total", "per_game"] as const) {
      const rows = buildPeriodStartsViewRows(filtered, ["ALL"], metric);
      expect(rows.map((row) => row.count)).toEqual([5, 2, 1]);
    }
  });

  it("honors the Type filter in the percent", () => {
    const quarters = filterPeriodStarts(
      data,
      ALL_COMPETITIONS,
      ALL_COMPETITION_KINDS,
      "quarters",
    );
    const [row] = buildPeriodStartsViewRows(quarters, ["ALL"], "per_game");
    expect(row?.value).toBe(50);
  });

  it("leaves players with no periods available out of the Periods per game view", () => {
    const rows = buildPeriodStartsViewRows(
      [{ ...bea, periodsAvailable: 0 }, ...filtered.slice(0, 1)],
      ["ALL"],
      "per_game",
    );
    expect(rows.map((row) => row.name)).toEqual(["Ada Wing"]);
  });

  it("filters by position", () => {
    const rows = buildPeriodStartsViewRows(filtered, ["WNG", "GK"], "total");
    expect(rows.map((row) => row.name)).toEqual(["Ada Wing", "Cal Keeper"]);
    expect(buildPeriodStartsViewRows(filtered, ["FWD"], "total")).toEqual([]);
  });

  it("breaks ties by name", () => {
    const rows = buildPeriodStartsViewRows(
      [
        { ...bea, name: "Zed", count: 2, periodsAvailable: 2 },
        { ...bea, name: "Amy", count: 2, periodsAvailable: 4 },
      ],
      ["ALL"],
      "per_game",
    );
    expect(rows.map((row) => row.name)).toEqual(["Amy", "Zed"]);
  });
});
