import "server-only";
import { listTeamCoaches } from "@/lib/data/coaches";
import { listCompetitions } from "@/lib/data/competitions";
import { listMatches } from "@/lib/data/matches";
import { listPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import { listRosterForTeam } from "@/lib/data/players";
import { getAllTeamStats, getTeamCompetitiveRecords } from "@/lib/data/stats";
import type { Club, Team } from "@/lib/supabase/database.types";
import { buildReportData } from "@/lib/report/build";
import { readReportContent } from "@/lib/report/content";
import { reportSlug } from "@/lib/report/slug";
import type { ReportData } from "@/lib/report/types";

/**
 * Gather everything the season report needs for the active team.
 *
 * `listMatches` resolves the active team itself, so `team` must be the active
 * team (the report route passes `getActiveTeam()`).
 */
export async function loadReportData(
  team: Team,
  club: Pick<Club, "name" | "colour" | "icon_url"> | null,
): Promise<{ data: ReportData | null; error: string | null }> {
  const [
    stats,
    records,
    matches,
    roster,
    coaches,
    competitions,
    monthAwards,
    content,
  ] = await Promise.all([
    getAllTeamStats(team.id),
    getTeamCompetitiveRecords(team.id),
    listMatches("played"),
    listRosterForTeam(team.id, { includeInactive: true }),
    listTeamCoaches(team.id),
    listCompetitions(team.id),
    listPlayerOfTheMonth(team.id),
    readReportContent(reportSlug(team)),
  ]);

  const error =
    stats.error ??
    records.error ??
    matches.error ??
    roster.error ??
    coaches.error ??
    competitions.error ??
    monthAwards.error;
  if (error) return { data: null, error };

  return {
    data: buildReportData({
      club,
      team,
      matches: matches.data,
      roster: roster.data,
      goalsByPlayer: stats.goalsByPlayer,
      assistsByPlayer: stats.assistsByPlayer,
      potmByPlayer: stats.potmByPlayer,
      matchesPlayed: stats.matchesPlayed,
      competitiveRecords: records.data,
      coaches: coaches.data,
      competitions: competitions.data,
      monthAwards: monthAwards.data,
      content,
    }),
    error: null,
  };
}
