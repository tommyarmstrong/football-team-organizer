import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Team, TeamRole } from "@/lib/supabase/database.types";

/**
 * Everything needed to make authorization decisions for the signed-in user in a
 * single request. RLS is the source of truth in the database; this context lets
 * the UI hide controls the user is not allowed to use.
 */
export type ViewerContext = {
  userId: string;
  email: string | null;
  managementClubIds: string[];
  /** Teams where the user is a coach (team_members.role = 'coach'). */
  coachTeamIds: string[];
  /** The user's direct team_members role per team. */
  memberTeamRoles: Record<string, TeamRole>;
  guardianPlayerIds: string[];
  selfPlayerIds: string[];
  /** RLS-filtered teams the user can read. */
  visibleTeams: Team[];
  /** Subset of visible teams the user can edit. */
  editableTeamIds: string[];
  isManagement: boolean;
};

export const getViewerContext = cache(
  async (): Promise<ViewerContext | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const [clubMembers, teamMembers, guardianLinks, selfPlayers, teams] =
      await Promise.all([
        supabase
          .from("club_members")
          .select("club_id, role")
          .eq("user_id", user.id),
        supabase
          .from("team_members")
          .select("team_id, role")
          .eq("user_id", user.id),
        supabase
          .from("guardians")
          .select("id, player_guardians(player_id)")
          .eq("user_id", user.id),
        supabase.from("players").select("id").eq("user_id", user.id),
        supabase.from("teams").select("*").order("name", { ascending: true }),
      ]);

    const managementClubIds = (clubMembers.data ?? [])
      .filter((row) => row.role === "management")
      .map((row) => row.club_id);

    const memberTeamRoles: Record<string, TeamRole> = {};
    const coachTeamIds: string[] = [];
    for (const row of teamMembers.data ?? []) {
      memberTeamRoles[row.team_id] = row.role;
      if (row.role === "coach") coachTeamIds.push(row.team_id);
    }

    const guardianPlayerIds = (guardianLinks.data ?? []).flatMap((guardian) => {
      const links = guardian.player_guardians as
        { player_id: string }[] | null | undefined;
      return (links ?? []).map((link) => link.player_id);
    });
    const selfPlayerIds = (selfPlayers.data ?? []).map((row) => row.id);
    const visibleTeams = (teams.data ?? []) as Team[];

    const managementClubSet = new Set(managementClubIds);
    const coachTeamSet = new Set(coachTeamIds);
    const editableTeamIds = visibleTeams
      .filter(
        (team) =>
          managementClubSet.has(team.club_id) || coachTeamSet.has(team.id),
      )
      .map((team) => team.id);

    return {
      userId: user.id,
      email: user.email ?? null,
      managementClubIds,
      coachTeamIds,
      memberTeamRoles,
      guardianPlayerIds,
      selfPlayerIds,
      visibleTeams,
      editableTeamIds,
      isManagement: managementClubIds.length > 0,
    };
  },
);

export function canReadTeam(ctx: ViewerContext, teamId: string): boolean {
  return ctx.visibleTeams.some((team) => team.id === teamId);
}

export function canEditTeam(ctx: ViewerContext, teamId: string): boolean {
  return ctx.editableTeamIds.includes(teamId);
}

export function canManageClub(ctx: ViewerContext, clubId: string): boolean {
  return ctx.managementClubIds.includes(clubId);
}

/** Club staff (management or a coach somewhere in the club) manage people. */
export function isClubStaff(ctx: ViewerContext, clubId: string): boolean {
  if (ctx.managementClubIds.includes(clubId)) return true;
  return ctx.visibleTeams.some(
    (team) => team.club_id === clubId && ctx.coachTeamIds.includes(team.id),
  );
}

/** Can the user edit a player's identity? Management, or a coach of a team the player is on. */
export function canEditPlayer(
  ctx: ViewerContext,
  playerClubId: string,
  playerTeamIds: string[],
): boolean {
  if (ctx.managementClubIds.includes(playerClubId)) return true;
  return playerTeamIds.some((teamId) => ctx.editableTeamIds.includes(teamId));
}

/** Can the user see/edit a player's sensitive contact details? */
export function canViewPlayerContact(
  ctx: ViewerContext,
  playerId: string,
  playerClubId: string,
  playerTeamIds: string[],
): boolean {
  if (canEditPlayer(ctx, playerClubId, playerTeamIds)) return true;
  if (ctx.guardianPlayerIds.includes(playerId)) return true;
  if (ctx.selfPlayerIds.includes(playerId)) return true;
  return false;
}

/** A short label for the user's highest role, for display in the header. */
export function viewerRoleLabel(ctx: ViewerContext): string {
  if (ctx.isManagement) return "Management";
  if (ctx.coachTeamIds.length > 0) return "Coach";
  if (ctx.guardianPlayerIds.length > 0) return "Guardian";
  if (ctx.selfPlayerIds.length > 0) return "Player";
  const roles = Object.values(ctx.memberTeamRoles);
  if (roles.includes("guardian")) return "Guardian";
  if (roles.includes("player")) return "Player";
  return "Member";
}
