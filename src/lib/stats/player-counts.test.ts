import { describe, expect, it } from "vitest";
import type { PlayerCountPoint } from "@/lib/data/stats";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  FRIENDLY_MATCHES,
} from "@/lib/stats/competition-filters";
import { filterPlayerCountPoints } from "@/lib/stats/player-counts";

const data: PlayerCountPoint[] = [
  {
    playerId: "1",
    name: "Ada",
    count: 3,
    events: [
      { competitionId: "c1", competitionKind: "league", isFriendly: false },
      { competitionId: "c1", competitionKind: "league", isFriendly: false },
      { competitionId: null, competitionKind: null, isFriendly: true },
    ],
  },
  {
    playerId: "2",
    name: "Bea",
    count: 1,
    events: [
      { competitionId: "c2", competitionKind: "cup", isFriendly: false },
    ],
  },
];

describe("filterPlayerCountPoints", () => {
  it("returns the original rows when no filter is set", () => {
    expect(
      filterPlayerCountPoints(data, ALL_COMPETITIONS, ALL_COMPETITION_KINDS),
    ).toEqual(data);
  });

  it("counts only matching events", () => {
    const rows = filterPlayerCountPoints(data, "c1", ALL_COMPETITION_KINDS);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ playerId: "1", count: 2 });
  });

  it("filters friendlies", () => {
    const rows = filterPlayerCountPoints(
      data,
      FRIENDLY_MATCHES,
      ALL_COMPETITION_KINDS,
    );
    expect(rows).toEqual([
      expect.objectContaining({ playerId: "1", count: 1 }),
    ]);
  });
});
