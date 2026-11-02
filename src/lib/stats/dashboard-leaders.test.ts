import { describe, expect, it } from "vitest";
import type {
  GoalsByPlayerPoint,
  PlayerCountPoint,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import {
  countLeaders,
  goalLeaders,
  recentLeagueAndCupForm,
} from "@/lib/stats/dashboard-leaders";

const league = {
  competitionId: "comp-league",
  competitionKind: "league" as const,
  isFriendly: false,
};
const cup = {
  competitionId: "comp-cup",
  competitionKind: "cup" as const,
  isFriendly: false,
};
const friendly = {
  competitionId: null,
  competitionKind: null,
  isFriendly: true,
};
const tournament = {
  competitionId: "comp-tournament",
  competitionKind: "tournament" as const,
  isFriendly: false,
};
const other = {
  competitionId: "comp-other",
  competitionKind: "other" as const,
  isFriendly: false,
};
const noCompetition = {
  competitionId: null,
  competitionKind: null,
  isFriendly: false,
};

function goalsPoint(
  n: number,
  events: GoalsByPlayerPoint["goalCompetitions"],
): GoalsByPlayerPoint {
  return {
    playerId: `player-${n}`,
    personId: `person-${n}`,
    name: `First${n} Last${n}`,
    goals: events.length,
    position: null,
    matchesPlayed: 0,
    periodsPlayed: 0,
    goalCompetitions: events,
  };
}

function countPoint(
  n: number,
  events: NonNullable<PlayerCountPoint["events"]>,
): PlayerCountPoint {
  return {
    playerId: `player-${n}`,
    personId: `person-${n}`,
    name: `First${n} Last${n}`,
    count: events.length,
    events,
  };
}

function repeat<T>(count: number, value: T): T[] {
  return Array.from({ length: count }, () => value);
}

describe("goalLeaders", () => {
  it("counts league and cup goals only", () => {
    const leaders = goalLeaders(
      [
        goalsPoint(1, [
          league,
          cup,
          friendly,
          tournament,
          other,
          noCompetition,
        ]),
      ],
      3,
    );
    expect(leaders).toEqual([
      {
        playerId: "player-1",
        personId: "person-1",
        name: "First1 Last1",
        count: 2,
      },
    ]);
  });

  it("leaves out players with no league or cup goals", () => {
    expect(
      goalLeaders([goalsPoint(1, [friendly, tournament, other])], 3),
    ).toEqual([]);
  });

  it("keeps every tied player through bronze and drops 4th place", () => {
    // Six players tied on one goal all share 1st, so none are cut.
    expect(
      goalLeaders(
        [1, 2, 3, 4, 5, 6].map((n) => goalsPoint(n, [league])),
        3,
      ),
    ).toHaveLength(6);

    // Ranks are 1, 2, 2, 4: both tied silvers stay and 4th place is dropped.
    expect(
      goalLeaders(
        [3, 2, 2, 1].map((count, index) =>
          goalsPoint(index + 1, repeat(count, league)),
        ),
        3,
      ).map((row) => [row.playerId, row.count]),
    ).toEqual([
      ["player-1", 3],
      ["player-2", 2],
      ["player-3", 2],
    ]);
  });
});

describe("countLeaders", () => {
  it("counts league and cup assists or awards only", () => {
    const leaders = countLeaders(
      [countPoint(1, [league, friendly, tournament, other])],
      3,
    );
    expect(leaders).toEqual([
      expect.objectContaining({ playerId: "player-1", count: 1 }),
    ]);
  });

  it("treats a missing events list as no events", () => {
    const point: PlayerCountPoint = {
      playerId: "player-1",
      personId: "person-1",
      name: "Sam Striker",
      count: 4,
    };
    expect(countLeaders([point], 3)).toEqual([]);
  });

  it("keeps every tied bronze", () => {
    // Ranks are 1, 2, 3, 3, 3, 3, 7.
    const counts = [5, 4, 3, 3, 3, 3, 1];
    expect(
      countLeaders(
        counts.map((count, index) =>
          countPoint(index + 1, repeat(count, league)),
        ),
        3,
      ).map((row) => [row.playerId, row.count]),
    ).toEqual([
      ["player-1", 5],
      ["player-2", 4],
      ["player-3", 3],
      ["player-4", 3],
      ["player-5", 3],
      ["player-6", 3],
    ]);
  });

  it("follows the same tie rule for awards: ranks 1, 1, 3, 3, 5 keep four", () => {
    const counts = [3, 3, 2, 2, 1];
    expect(
      countLeaders(
        counts.map((count, index) => countPoint(index + 1, repeat(count, cup))),
        3,
      ).map((row) => [row.playerId, row.count]),
    ).toEqual([
      ["player-1", 3],
      ["player-2", 3],
      ["player-3", 2],
      ["player-4", 2],
    ]);
  });

  it("orders players tied on a count by name so the result is stable", () => {
    const leaders = countLeaders(
      [
        { ...countPoint(2, [league]), name: "Zed Zane" },
        { ...countPoint(1, [league]), name: "Amy Ash" },
      ],
      3,
    );
    expect(leaders.map((row) => row.name)).toEqual(["Amy Ash", "Zed Zane"]);
  });

  it("trims names", () => {
    const leaders = countLeaders(
      [{ ...countPoint(1, [league]), name: "Madonna " }],
      3,
    );
    expect(leaders[0]?.name).toBe("Madonna");
  });
});

describe("recentLeagueAndCupForm", () => {
  function result(
    id: string,
    result: "W" | "D" | "L",
    competition: {
      competitionId: string | null;
      competitionKind: ResultOverTimePoint["competitionKind"];
      isFriendly: boolean;
    },
  ): ResultOverTimePoint {
    return {
      matchId: id,
      date: "2025-09-01",
      label: id,
      goalsFor: 0,
      goalsAgainst: 0,
      result,
      competitionName: null,
      ...competition,
    };
  }

  it("keeps league and cup results only, oldest to newest", () => {
    expect(
      recentLeagueAndCupForm([
        result("m-league", "W", league),
        result("m-tournament", "D", tournament),
        result("m-cup", "L", cup),
        result("m-other", "W", other),
        result("m-friendly", "L", friendly),
      ]),
    ).toEqual(["W", "L"]);
  });

  it("returns only the most recent results up to the limit", () => {
    const results = (["W", "L", "D", "W", "W"] as const).map((r, index) =>
      result(`m${index}`, r, league),
    );
    expect(recentLeagueAndCupForm(results, 3)).toEqual(["D", "W", "W"]);
  });

  it("returns an empty form when there are no results", () => {
    expect(recentLeagueAndCupForm([])).toEqual([]);
  });
});
