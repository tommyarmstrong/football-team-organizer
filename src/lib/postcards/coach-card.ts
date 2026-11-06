import "server-only";

import { canGenerateCoachCard, getViewerContext } from "@/lib/authz/context";
import { isValidClubColour } from "@/lib/clubs/branding";
import { getClub } from "@/lib/data/clubs";
import { getCoach, getCoachTeams } from "@/lib/data/coaches";
import { getAllTeamStats } from "@/lib/data/stats";
import { getActiveTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import {
  coachCardCaption,
  coachCardFileName,
  coachCardNames,
  coachCardStats,
  coachRoleLabel,
} from "@/lib/postcards/coach-card-content";
import { pickCardTeam } from "@/lib/postcards/player-card-content";
import type { CoachCardPayload } from "@/lib/postcards/types";

export type { CoachCardPayload } from "@/lib/postcards/types";

/**
 * Assembles a coach card for the signed-in viewer.
 *
 * Returns `{ data: null, error: null }` when there is nothing the viewer may
 * generate (unknown coach, no team, or not the coach / a coach or manager of
 * the team / a club manager), so callers cannot tell a hidden card from a
 * missing one.
 */
export async function buildCoachCardPayload(
  coachId: string,
  options: { teamId?: string | null; personId?: string | null } = {},
): Promise<{ data: CoachCardPayload | null; error: string | null }> {
  const ctx = await getViewerContext();
  if (!ctx) return { data: null, error: null };

  const [coachResult, membershipsResult, activeTeam] = await Promise.all([
    getCoach(coachId),
    getCoachTeams(coachId),
    getActiveTeam(),
  ]);
  if (coachResult.error) return { data: null, error: coachResult.error };
  if (membershipsResult.error) {
    return { data: null, error: membershipsResult.error };
  }
  const coach = coachResult.data;
  if (!coach || !coach.active_role) return { data: null, error: null };
  if (options.personId && coach.person_id !== options.personId) {
    return { data: null, error: null };
  }

  const memberships = membershipsResult.data;
  const allowedTeams = ctx.visibleTeams.filter(
    (team) =>
      team.club_id === coach.club_id &&
      memberships.some((row) => row.team_id === team.id) &&
      canGenerateCoachCard(ctx, coach, team.id),
  );
  const team = pickCardTeam(allowedTeams, {
    requestedTeamId: options.teamId ?? null,
    activeTeamId: activeTeam?.id ?? null,
  });
  if (!team) return { data: null, error: null };

  const [clubResult, stats] = await Promise.all([
    getClub(team.club_id),
    getAllTeamStats(team.id),
  ]);
  if (stats.error) return { data: null, error: stats.error };

  const club = clubResult.data;
  const names = coachCardNames(coach);
  const teamName = teamDisplayName(team);
  const roleLabel = coachRoleLabel(
    memberships.find((row) => row.team_id === team.id)?.role,
  );
  const cardStats = coachCardStats(stats.resultsOverTime);
  const clubName = club?.name ?? "";

  return {
    data: {
      coachId,
      teamId: team.id,
      clubName,
      clubColour:
        club?.colour && isValidClubColour(club.colour) ? club.colour : null,
      clubIconUrl: club?.icon_url ?? null,
      teamName,
      ageGroup: team.age_group,
      seasonLabel: team.season_label,
      firstName: names.firstName,
      lastName: names.lastName,
      roleLabel,
      stats: cardStats,
      caption: coachCardCaption({
        coach,
        roleLabel,
        clubName,
        teamName,
        seasonLabel: team.season_label,
        stats: cardStats,
      }),
      fileName: coachCardFileName({
        firstName: names.firstName,
        lastName: names.lastName,
        teamName,
        seasonLabel: team.season_label,
      }),
    },
    error: null,
  };
}
