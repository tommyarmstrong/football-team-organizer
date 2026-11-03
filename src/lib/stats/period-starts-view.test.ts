import { describe, expect, it } from "vitest";
import type { PlayerCountPoint } from "@/lib/data/stats";
import { buildCountViewRows } from "@/lib/stats/count-view";
import {
  filterPlayerCountPoints,
  withPlayedAppearanceCounts,
} from "@/lib/stats/player-counts";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
} from "@/lib/stats/competition-filters";

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

/** Period starts as the stats page receives them: one event per start. */
const periodStarts: PlayerCountPoint[] = [
  {
    playerId: "1",
    personId: "person-1",
    name: "Ada Wing",
    count: 5,
    position: "WNG",
    events: [league, league, league, cup, friendly],
  },
  {
    playerId: "2",
    personId: "person-2",
    name: "Bea Def",
    count: 4,
    position: "DEF",
    events: [league, league, cup, cup],
  },
  {
    playerId: "3",
    personId: "person-3",
    name: "Cal Keeper",
    count: 1,
    position: "GK",
    events: [friendly],
  },
];

const appearances: PlayerCountPoint[] = [
  { playerId: "1", personId: "person-1", name: "Ada Wing", count: 3 },
  { playerId: "2", personId: "person-2", name: "Bea Def", count: 2 },
  { playerId: "3", personId: "person-3", name: "Cal Keeper", count: 1 },
];

describe("period starts view", () => {
  it("divides periods by the player's games, to two decimals", () => {
    const [row] = withPlayedAppearanceCounts(periodStarts, appearances);
    expect(row).toMatchObject({ count: 5, matchesPlayed: 3 });
    expect(((row?.count ?? 0) / (row?.matchesPlayed ?? 1)).toFixed(2)).toBe(
      "1.67",
    );
  });

  it("counts only the starts in the selected competition type", () => {
    const leagueOnly = filterPlayerCountPoints(
      periodStarts,
      ALL_COMPETITIONS,
      "league",
    );
    expect(leagueOnly.map((row) => [row.name, row.count])).toEqual([
      ["Ada Wing", 3],
      ["Bea Def", 2],
    ]);
  });

  it("counts only the starts in the selected competition", () => {
    const cupOnly = filterPlayerCountPoints(
      periodStarts,
      "cup-1",
      ALL_COMPETITION_KINDS,
    );
    expect(cupOnly.map((row) => [row.name, row.count])).toEqual([
      ["Bea Def", 2],
      ["Ada Wing", 1],
    ]);
  });

  it("filters the filtered rows by position and keeps the total view", () => {
    const rows = buildCountViewRows(
      withPlayedAppearanceCounts(periodStarts, appearances),
      ["WNG", "GK"],
      "total",
    );
    expect(rows.map((row) => [row.name, row.value])).toEqual([
      ["Ada Wing", 5],
      ["Cal Keeper", 1],
    ]);
  });

  it("shows everyone for ALL positions, most starts first", () => {
    const rows = buildCountViewRows(periodStarts, ["ALL"], "total");
    expect(rows.map((row) => row.name)).toEqual([
      "Ada Wing",
      "Bea Def",
      "Cal Keeper",
    ]);
  });

  it("returns nothing for a position nobody started in", () => {
    expect(buildCountViewRows(periodStarts, ["FWD"], "total")).toEqual([]);
  });

  it("keeps a player's games at zero when they have no appearances in the filter", () => {
    const [row] = withPlayedAppearanceCounts(periodStarts, []);
    expect(row?.matchesPlayed).toBe(0);
  });
});
