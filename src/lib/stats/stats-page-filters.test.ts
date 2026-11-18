import { describe, expect, it } from "vitest";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
  FRIENDLY_KIND,
  NO_COMPETITION,
} from "@/lib/stats/competition-filters";
import {
  clearStatsFilterChip,
  defaultStatsFilters,
  readStoredStatsFilters,
  sanitizeStatsFilters,
  statsFilterChips,
  statsFiltersAreCustom,
  writeStoredStatsFilters,
  type StatsFilterSelection,
} from "@/lib/stats/stats-page-filters";

const competitions = [
  { id: "league", name: "Sunday League", kind: "league" as const },
  { id: "cup", name: "County Cup", kind: "cup" as const },
];

function memoryStorage(initial = "") {
  const values = new Map<string, string>();
  if (initial) values.set("fto-stats-filters", initial);
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    dump() {
      return values.get("fto-stats-filters") ?? "";
    },
  };
}

describe("defaultStatsFilters", () => {
  it("starts from all matches, league and cup, and every position", () => {
    expect(defaultStatsFilters()).toEqual({
      competitionId: ALL_COMPETITIONS,
      competitionKind: ALL_LEAGUE_AND_CUP,
      positions: ["ALL"],
    });
  });
});

describe("sanitizeStatsFilters", () => {
  it("drops a competition the current team does not have", () => {
    expect(
      sanitizeStatsFilters(
        {
          competitionId: "other-team-cup",
          competitionKind: FRIENDLY_KIND,
          positions: ["FWD", "GK"],
        },
        competitions,
      ),
    ).toEqual({
      competitionId: ALL_COMPETITIONS,
      competitionKind: FRIENDLY_KIND,
      positions: ["FWD", "GK"],
    });
  });

  it("keeps a competition that is on this team", () => {
    expect(
      sanitizeStatsFilters(
        {
          competitionId: "cup",
          competitionKind: ALL_LEAGUE_AND_CUP,
          positions: ["ALL"],
        },
        competitions,
      ).competitionId,
    ).toBe("cup");
  });

  it("resets a competition type outside the three page options", () => {
    expect(
      sanitizeStatsFilters(
        {
          competitionId: ALL_COMPETITIONS,
          competitionKind: "competitive",
          positions: ["ALL"],
        },
        competitions,
      ).competitionKind,
    ).toBe(ALL_LEAGUE_AND_CUP);
  });

  it("falls back when the stored value is unusable", () => {
    expect(sanitizeStatsFilters(null, competitions)).toEqual(
      defaultStatsFilters(),
    );
    expect(
      sanitizeStatsFilters(
        { positions: ["not-a-position", "ALL"] },
        competitions,
      ).positions,
    ).toEqual(["ALL"]);
  });

  it("keeps selected positions in the page order", () => {
    expect(
      sanitizeStatsFilters({ positions: ["GK", "FWD", "FWD"] }, competitions)
        .positions,
    ).toEqual(["FWD", "GK"]);
  });
});

describe("statsFilterChips", () => {
  it("hides chips while the filters are at their defaults", () => {
    const filters = defaultStatsFilters();
    expect(statsFilterChips(filters, competitions)).toEqual([]);
    expect(statsFiltersAreCustom(filters, competitions)).toBe(false);
  });

  it("shows a chip for each active non-default filter", () => {
    const filters: StatsFilterSelection = {
      competitionId: "league",
      competitionKind: ALL_COMPETITION_KINDS,
      positions: ["MID", "DEF"],
    };
    expect(statsFilterChips(filters, competitions)).toEqual([
      { id: "competition", label: "Sunday League" },
      { id: "type", label: "All types" },
      { id: "position:MID", label: "MID" },
      { id: "position:DEF", label: "DEF" },
    ]);
    expect(statsFiltersAreCustom(filters, competitions)).toBe(true);
  });

  it("labels matches with no competition", () => {
    expect(
      statsFilterChips(
        { ...defaultStatsFilters(), competitionId: NO_COMPETITION },
        competitions,
      ),
    ).toEqual([{ id: "competition", label: "Unknown competitions" }]);
  });
});

describe("clearStatsFilterChip", () => {
  it("clears one filter and leaves the others", () => {
    const filters: StatsFilterSelection = {
      competitionId: "cup",
      competitionKind: FRIENDLY_KIND,
      positions: ["FWD", "WNG"],
    };
    expect(clearStatsFilterChip(filters, "competition").competitionId).toBe(
      ALL_COMPETITIONS,
    );
    expect(clearStatsFilterChip(filters, "type").competitionKind).toBe(
      ALL_LEAGUE_AND_CUP,
    );
    expect(clearStatsFilterChip(filters, "position:FWD").positions).toEqual([
      "WNG",
    ]);
  });

  it("returns to every position when the last position chip is removed", () => {
    const filters: StatsFilterSelection = {
      ...defaultStatsFilters(),
      positions: ["GK"],
    };
    expect(clearStatsFilterChip(filters, "position:GK").positions).toEqual([
      "ALL",
    ]);
  });
});

describe("stored stats filters", () => {
  it("remembers a team and does not apply that choice to another team", () => {
    const storage = memoryStorage();
    const saved: StatsFilterSelection = {
      competitionId: "league",
      competitionKind: FRIENDLY_KIND,
      positions: ["DEF"],
    };
    writeStoredStatsFilters(storage, "team-a", saved);

    expect(readStoredStatsFilters(storage, "team-a", competitions)).toEqual(
      saved,
    );
    expect(readStoredStatsFilters(storage, "team-b", competitions)).toEqual(
      defaultStatsFilters(),
    );
  });

  it("drops a stored competition the team no longer has", () => {
    const storage = memoryStorage(
      JSON.stringify({
        "team-a": {
          competitionId: "retired-cup",
          competitionKind: ALL_COMPETITION_KINDS,
          positions: ["MID"],
        },
      }),
    );
    expect(readStoredStatsFilters(storage, "team-a", competitions)).toEqual({
      competitionId: ALL_COMPETITIONS,
      competitionKind: ALL_COMPETITION_KINDS,
      positions: ["MID"],
    });
  });

  it("ignores a broken store", () => {
    const storage = memoryStorage("{");
    expect(readStoredStatsFilters(storage, "team-a", competitions)).toEqual(
      defaultStatsFilters(),
    );
  });

  it("keeps another team's saved filters when this team is written", () => {
    const storage = memoryStorage();
    writeStoredStatsFilters(storage, "team-a", {
      ...defaultStatsFilters(),
      positions: ["GK"],
    });
    writeStoredStatsFilters(storage, "team-b", {
      ...defaultStatsFilters(),
      competitionKind: FRIENDLY_KIND,
    });
    expect(
      readStoredStatsFilters(storage, "team-a", competitions).positions,
    ).toEqual(["GK"]);
    expect(storage.dump()).toContain("team-a");
    expect(storage.dump()).toContain("team-b");
  });
});
