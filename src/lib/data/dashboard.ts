import { cache } from "react";
import {
  canEditActiveMatchDay,
  canEditActiveTeamHistory,
} from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import { getLastResult, getNextFixture } from "@/lib/data/matches";
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import {
  getRecentForm,
  getTopAssists,
  getTopPlayersOfTheMatch,
  getTopScorers,
  getAllTeamStats,
} from "@/lib/data/stats";
import { DASHBOARD_MEDAL_RANKS } from "@/lib/constants";

/**
 * §5.5 — One cached fetch for dashboard sections that overlap on match/goal
 * data. Each Suspense section still renders independently; React.cache()
 * shares this promise so the four sections do not duplicate the work.
 */
export const getDashboardData = cache(async (teamId: string) => {
  const [
    next,
    last,
    canEditMatch,
    form,
    competitions,
    canEditTeam,
    scorers,
    assists,
    potm,
    potMonth,
    stats,
  ] = await Promise.all([
    getNextFixture(),
    getLastResult(),
    canEditActiveMatchDay(),
    getRecentForm(),
    listCompetitions(teamId),
    canEditActiveTeamHistory(),
    getTopScorers(DASHBOARD_MEDAL_RANKS),
    getTopAssists(DASHBOARD_MEDAL_RANKS),
    getTopPlayersOfTheMatch(DASHBOARD_MEDAL_RANKS),
    listPlayerOfTheMonth(teamId, 5),
    getAllTeamStats(teamId),
  ]);

  return {
    next,
    last,
    canEditMatch,
    form,
    competitions,
    canEditTeam,
    scorers,
    assists,
    potm,
    potMonth,
    stats,
  };
});
