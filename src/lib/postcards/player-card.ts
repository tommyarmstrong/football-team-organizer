import "server-only";

import { canGeneratePlayerCard, getViewerContext } from "@/lib/authz/context";
import { isValidClubColour } from "@/lib/clubs/branding";
import { getClub } from "@/lib/data/clubs";
import { getPlayer, getPlayerTeams } from "@/lib/data/players";
import { getAllTeamStats, getPlayerCompetitiveRecord } from "@/lib/data/stats";
import { getActiveTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import {
  pickPlayerCardTeam,
  playerCardCaption,
  playerCardFileName,
  playerCardNames,
  playerPositionLabel,
} from "@/lib/postcards/player-card-content";
import type { PlayerCardPayload } from "@/lib/postcards/types";

export type { PlayerCardPayload } from "@/lib/postcards/types";

/** One entry per goal / assist / award; friendlies are left out of the card. */
function countCompetitive(
  events: ReadonlyArray<{ isFriendly: boolean }> | undefined,
): number {
  return (events ?? []).filter((event) => !event.isFriendly).length;
}

/**
 * Assembles a player card for the signed-in viewer.
 *
 * Returns `{ data: null, error: null }` when there is nothing the viewer may
 * generate (unknown player, no team, or not a guardian / coach / manager), so
 * callers cannot tell a hidden card from a missing one.
 */
export async function buildPlayerCardPayload(
  playerId: string,
  options: { teamId?: string | null; personId?: string | null } = {},
): Promise<{ data: PlayerCardPayload | null; error: string | null }> {
  const ctx = await getViewerContext();
  if (!ctx) return { data: null, error: null };

  const [playerResult, membershipsResult, activeTeam] = await Promise.all([
    getPlayer(playerId),
    getPlayerTeams(playerId),
    getActiveTeam(),
  ]);
  if (playerResult.error) return { data: null, error: playerResult.error };
  if (membershipsResult.error) {
    return { data: null, error: membershipsResult.error };
  }
  const player = playerResult.data;
  if (!player || !player.active_role) return { data: null, error: null };
  if (options.personId && player.person_id !== options.personId) {
    return { data: null, error: null };
  }

  const memberships = membershipsResult.data;
  const allowedTeams = ctx.visibleTeams.filter(
    (team) =>
      team.club_id === player.club_id &&
      memberships.some((row) => row.team_id === team.id) &&
      canGeneratePlayerCard(ctx, player, team.id),
  );
  const team = pickPlayerCardTeam(allowedTeams, {
    requestedTeamId: options.teamId ?? null,
    activeTeamId: activeTeam?.id ?? null,
    preferredTeamIds: memberships
      .filter((row) => row.active)
      .map((row) => row.team_id),
  });
  if (!team) return { data: null, error: null };

  const [clubResult, stats, recordResult] = await Promise.all([
    getClub(team.club_id),
    getAllTeamStats(team.id),
    getPlayerCompetitiveRecord(team.id, playerId),
  ]);
  if (stats.error) return { data: null, error: stats.error };
  if (recordResult.error) return { data: null, error: recordResult.error };
  const { wins, draws, losses } = recordResult.data;

  const club = clubResult.data;
  const shirtNumber =
    memberships.find((row) => row.team_id === team.id)?.shirt_number ?? null;
  const names = playerCardNames(player, team.gender);
  const teamName = teamDisplayName(team);
  const positionLabel = playerPositionLabel(player.position);
  const cardStats = {
    appearances: wins + draws + losses,
    wins,
    draws,
    losses,
    goals: countCompetitive(
      stats.goalsByPlayer.find((row) => row.playerId === playerId)
        ?.goalCompetitions,
    ),
    assists: countCompetitive(
      stats.assistsByPlayer.find((row) => row.playerId === playerId)?.events,
    ),
    potm: countCompetitive(
      stats.potmByPlayer.find((row) => row.playerId === playerId)?.events,
    ),
  };
  const clubName = club?.name ?? "";

  return {
    data: {
      playerId,
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
      shirtNumber,
      positionLabel,
      stats: cardStats,
      caption: playerCardCaption({
        player,
        gender: team.gender,
        shirtNumber,
        clubName,
        teamName,
        seasonLabel: team.season_label,
        positionLabel,
        stats: cardStats,
      }),
      fileName: playerCardFileName({
        firstName: names.firstName,
        teamName,
        seasonLabel: team.season_label,
      }),
    },
    error: null,
  };
}
