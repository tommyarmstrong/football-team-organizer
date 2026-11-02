import { STATS_FORM_LIMIT } from "@/lib/constants";
import type {
  GoalsByPlayerPoint,
  PlayerCountPoint,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import {
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
  isLeagueAndCupMatch,
  type StatCompetitionRef,
} from "@/lib/stats/competition-filters";
import { takeThroughRank } from "@/lib/stats/ranking";
import { filterResults } from "@/lib/stats/results-view";

/**
 * Dashboard leaderboards and form count league and cup matches only. They are
 * derived from the same `get_team_stats` result as the stats page, so the
 * dashboard needs no queries of its own for them.
 */

export type DashboardLeader = {
  playerId: string;
  personId: string;
  name: string;
  count: number;
};

type LeaderSource = {
  playerId: string;
  personId: string;
  name: string;
  /** One entry per goal / assist / award, with the match's competition. */
  events: readonly StatCompetitionRef[];
};

function leadersThroughRank(
  rows: readonly LeaderSource[],
  maxRank: number,
): DashboardLeader[] {
  const counted: DashboardLeader[] = [];
  for (const row of rows) {
    const count = row.events.filter((event) =>
      isLeagueAndCupMatch(event),
    ).length;
    if (count === 0) continue;
    counted.push({
      playerId: row.playerId,
      personId: row.personId,
      name: row.name.trim(),
      count,
    });
  }
  counted.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return takeThroughRank(counted, (row) => row.count, maxRank);
}

/** Top scorers in league and cup matches, keeping players tied through `maxRank`. */
export function goalLeaders(
  goals: readonly GoalsByPlayerPoint[],
  maxRank: number,
): DashboardLeader[] {
  return leadersThroughRank(
    goals.map((row) => ({
      playerId: row.playerId,
      personId: row.personId,
      name: row.name,
      events: row.goalCompetitions,
    })),
    maxRank,
  );
}

/** Assist or player-of-the-match leaders in league and cup matches. */
export function countLeaders(
  points: readonly PlayerCountPoint[],
  maxRank: number,
): DashboardLeader[] {
  return leadersThroughRank(
    points.map((row) => ({
      playerId: row.playerId,
      personId: row.personId,
      name: row.name,
      events: row.events ?? [],
    })),
    maxRank,
  );
}

/**
 * The last `limit` league and cup results, oldest to newest. `results` must be
 * in chronological order, as `get_team_stats` returns them.
 */
export function recentLeagueAndCupForm(
  results: readonly ResultOverTimePoint[],
  limit = STATS_FORM_LIMIT,
): Array<"W" | "D" | "L"> {
  return filterResults([...results], ALL_COMPETITIONS, ALL_LEAGUE_AND_CUP)
    .map((point) => point.result)
    .slice(-limit);
}
