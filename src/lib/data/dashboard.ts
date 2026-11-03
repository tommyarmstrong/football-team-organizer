import { cache } from "react";
import {
  canEditActiveMatchDay,
  canEditActiveTeamHistory,
} from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import { getLastResult, getNextFixture } from "@/lib/data/matches";
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import { getAllTeamStats } from "@/lib/data/stats";
import { DASHBOARD_MEDAL_RANKS } from "@/lib/constants";
import {
  countLeaders,
  goalLeaders,
  recentLeagueAndCupForm,
  type DashboardLeader,
} from "@/lib/stats/dashboard-leaders";

/**
 * Starts a promise's work and marks its rejection as handled, so a section
 * that has not reached its `await` yet cannot trigger an unhandled-rejection
 * warning. Awaiting the returned promise still throws as normal.
 */
function started<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  return promise;
}

type LeadersResult = { data: DashboardLeader[]; error: string | null };

/**
 * §5.5 — Dashboard data as a set of started promises. Every query begins
 * immediately and runs in parallel, but nothing here waits for all of them:
 * each Suspense section awaits only the promises it renders, so the fast
 * sections stream in without waiting for the slowest query.
 *
 * Leaderboards and form are derived from the `get_team_stats` result (the same
 * call the stats page makes, shared through `React.cache`), so they cost no
 * extra queries.
 *
 * Cached per request with `React.cache()` so the sections share the promises.
 */
export const getDashboardData = cache((teamId: string) => {
  const stats = started(getAllTeamStats(teamId));

  const leaders = (
    pick: (s: Awaited<typeof stats>) => DashboardLeader[],
  ): Promise<LeadersResult> =>
    started(
      stats.then((s) =>
        s.error ? { data: [], error: s.error } : { data: pick(s), error: null },
      ),
    );

  return {
    next: started(getNextFixture()),
    last: started(getLastResult()),
    canEditMatch: started(canEditActiveMatchDay()),
    competitions: started(listCompetitions(teamId)),
    canEditTeam: started(canEditActiveTeamHistory()),
    potMonth: started(listPlayerOfTheMonth(teamId, 5)),
    stats,
    form: started(
      stats.then((s) => ({
        form: s.error ? [] : recentLeagueAndCupForm(s.resultsOverTime),
        error: s.error,
      })),
    ),
    scorers: leaders((s) =>
      goalLeaders(s.goalsByPlayer, DASHBOARD_MEDAL_RANKS),
    ),
    assists: leaders((s) =>
      countLeaders(s.assistsByPlayer, DASHBOARD_MEDAL_RANKS),
    ),
    potm: leaders((s) => countLeaders(s.potmByPlayer, DASHBOARD_MEDAL_RANKS)),
  };
});
