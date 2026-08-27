import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { personDisplayName } from "@/lib/people/person";
import { isTeamArchived } from "@/lib/team/season";
import type { Team, TeamRole } from "@/lib/supabase/database.types";

/**
 * Everything needed to make authorization decisions for the signed-in user in a
 * single request. RLS is the source of truth in the database; this context lets
 * the UI hide controls the user is not allowed to use.
 *
 * Team roles are additive: a user may hold any combination of roles on a given
 * team (e.g. coach + player + management on team A, coach only on team B).
 * Club management is the manager role linked to a login.
 */
export type ViewerContext = {
  userId: string;
  email: string | null;
  /** Linked people.first_name when available. */
  firstName: string | null;
  /** Linked people.last_name when available. */
  lastName: string | null;
  /**
   * Prefer people first + last name; else auth metadata; else email local-part.
   */
  displayName: string | null;
  /** Linked people.id when the login is attached to a person. */
  personId: string | null;
  managementClubIds: string[];
  /** Teams where the user holds the team_members role `coach`. */
  coachTeamIds: string[];
  /** Teams where the user holds the team_members role `management`. */
  managementTeamIds: string[];
  /** All team_members roles for the user, keyed by team id. */
  memberTeamRoles: Record<string, TeamRole[]>;
  guardianPlayerIds: string[];
  selfPlayerIds: string[];
  /** RLS-filtered teams the user can read. */
  visibleTeams: Team[];
  /** Subset of visible teams the user can edit. */
  editableTeamIds: string[];
  isManagement: boolean;
};

/** Prefer auth metadata name; fall back to email local-part. */
export function resolveAuthDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string | null {
  const meta = user.user_metadata ?? {};
  for (const key of ["full_name", "name", "display_name"] as const) {
    const value = meta[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  const email = user.email?.trim();
  if (!email) return null;
  const localPart = email.split("@")[0]?.trim();
  return localPart || null;
}

export const getViewerContext = cache(
  async (): Promise<ViewerContext | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: selfPerson } = await supabase
      .from("people")
      .select("id, first_name, last_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const personId = selfPerson?.id ?? null;
    const firstName = selfPerson?.first_name?.trim() || null;
    const lastName = selfPerson?.last_name?.trim() || null;
    const peopleDisplayName =
      firstName && lastName
        ? personDisplayName({ first_name: firstName, last_name: lastName })
        : firstName || lastName || null;

    const [managers, teamMembers, guardianLinks, selfPlayers, teams] =
      await Promise.all([
        personId
          ? supabase
              .from("managers")
              .select("club_id")
              .eq("person_id", personId)
          : Promise.resolve({ data: [] as { club_id: string }[], error: null }),
        supabase
          .from("team_members")
          .select("team_id, role")
          .eq("user_id", user.id),
        personId
          ? supabase
              .from("guardians")
              .select("id, player_guardians(player_id)")
              .eq("person_id", personId)
          : Promise.resolve({
              data: [] as {
                id: string;
                player_guardians: { player_id: string }[] | null;
              }[],
              error: null,
            }),
        personId
          ? supabase.from("players").select("id").eq("person_id", personId)
          : Promise.resolve({ data: [] as { id: string }[], error: null }),
        supabase.from("teams").select("*").order("name", { ascending: true }),
      ]);

    const managementClubIds = (managers.data ?? []).map((row) => row.club_id);

    const memberTeamRoles: Record<string, TeamRole[]> = {};
    const coachTeamIds: string[] = [];
    const managementTeamIds: string[] = [];
    for (const row of teamMembers.data ?? []) {
      const roles = memberTeamRoles[row.team_id] ?? [];
      roles.push(row.role);
      memberTeamRoles[row.team_id] = roles;
      if (row.role === "coach") coachTeamIds.push(row.team_id);
      if (row.role === "management") managementTeamIds.push(row.team_id);
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
    const managementTeamSet = new Set(managementTeamIds);
    const editableTeamIds = visibleTeams
      .filter(
        (team) =>
          managementClubSet.has(team.club_id) ||
          managementTeamSet.has(team.id) ||
          coachTeamSet.has(team.id),
      )
      .map((team) => team.id);

    return {
      userId: user.id,
      email: user.email ?? null,
      firstName,
      lastName,
      displayName: peopleDisplayName ?? resolveAuthDisplayName(user),
      personId,
      managementClubIds,
      coachTeamIds,
      managementTeamIds,
      memberTeamRoles,
      guardianPlayerIds,
      selfPlayerIds,
      visibleTeams,
      editableTeamIds,
      isManagement:
        managementClubIds.length > 0 || managementTeamIds.length > 0,
    };
  },
);

export function hasTeamRole(
  ctx: ViewerContext,
  teamId: string,
  role: TeamRole,
): boolean {
  return ctx.memberTeamRoles[teamId]?.includes(role) ?? false;
}

export function canReadTeam(ctx: ViewerContext, teamId: string): boolean {
  return ctx.visibleTeams.some((team) => team.id === teamId);
}

/** True when this people row is the signed-in user's own person. */
export function isSelfPerson(
  ctx: ViewerContext,
  person: { id: string; auth_user_id: string | null },
): boolean {
  if (ctx.personId && person.id === ctx.personId) return true;
  return person.auth_user_id === ctx.userId;
}

export function canEditTeam(ctx: ViewerContext, teamId: string): boolean {
  return ctx.editableTeamIds.includes(teamId);
}

/** Look up a visible team by id (used for archive checks). */
export function findVisibleTeam(
  ctx: ViewerContext,
  teamId: string,
): Team | undefined {
  return ctx.visibleTeams.find((team) => team.id === teamId);
}

/**
 * Mutate historical team data (squad, competitions, staff links, POTM).
 * Blocked when the season team is archived; team profile / unarchive still use
 * {@link canEditTeam}.
 */
export function canMutateTeamData(ctx: ViewerContext, teamId: string): boolean {
  const team = findVisibleTeam(ctx, teamId);
  if (team && isTeamArchived(team)) return false;
  return canEditTeam(ctx, teamId);
}

/**
 * Record fixtures and match-day events (squad, periods, goals/assists, cards).
 * Guardian assistants get this without full team-edit rights (no POTM).
 * Blocked when the season team is archived.
 */
export function canEditMatchDay(ctx: ViewerContext, teamId: string): boolean {
  const team = findVisibleTeam(ctx, teamId);
  if (team && isTeamArchived(team)) return false;
  return (
    canEditTeam(ctx, teamId) || hasTeamRole(ctx, teamId, "guardian_assistant")
  );
}

export function canManageClub(ctx: ViewerContext, clubId: string): boolean {
  return ctx.managementClubIds.includes(clubId);
}

/** Club staff (management or a coach somewhere in the club) manage people. */
export function isClubStaff(ctx: ViewerContext, clubId: string): boolean {
  if (ctx.managementClubIds.includes(clubId)) return true;
  return ctx.visibleTeams.some(
    (team) =>
      team.club_id === clubId &&
      (ctx.coachTeamIds.includes(team.id) ||
        ctx.managementTeamIds.includes(team.id)),
  );
}

/** Teams the viewer coaches or manages at team level. */
export function staffTeamIds(ctx: ViewerContext): string[] {
  return [...new Set([...ctx.coachTeamIds, ...ctx.managementTeamIds])];
}

/**
 * Club and People pages: club managers, team managers, coaches, and
 * guardians (including guardian assistants).
 */
export function canAccessClubAndPeople(ctx: ViewerContext): boolean {
  if (ctx.isManagement || ctx.coachTeamIds.length > 0) return true;
  if (ctx.guardianPlayerIds.length > 0) return true;
  const roles = Object.values(ctx.memberTeamRoles).flat();
  return roles.includes("guardian") || roles.includes("guardian_assistant");
}

/** Teams card on the club page: club managers and club staff (coaches). */
export function canViewClubTeams(ctx: ViewerContext, clubId: string): boolean {
  return canManageClub(ctx, clubId) || isClubStaff(ctx, clubId);
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

/** True when the viewer is a guardian of this player record. */
export function isGuardianOfPlayer(
  ctx: ViewerContext,
  playerId: string,
): boolean {
  return ctx.guardianPlayerIds.includes(playerId);
}

/**
 * Name, email, and phone: the person themselves, club managers, or a guardian
 * of this player's person record.
 */
export function canEditPersonDetails(
  ctx: ViewerContext,
  person: { id: string; auth_user_id: string | null },
  playerId: string | null,
  clubId: string | null,
): boolean {
  if (isSelfPerson(ctx, person)) return true;
  if (clubId && canManageClub(ctx, clubId)) return true;
  if (playerId && isGuardianOfPlayer(ctx, playerId)) return true;
  return false;
}

/** DOB and school on a linked player: club managers or that player's guardian. */
export function canEditLinkedPlayerProfile(
  ctx: ViewerContext,
  playerId: string,
  playerClubId: string,
): boolean {
  if (canManageClub(ctx, playerClubId)) return true;
  return isGuardianOfPlayer(ctx, playerId);
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
  const roles = Object.values(ctx.memberTeamRoles).flat();
  if (roles.includes("guardian") || roles.includes("guardian_assistant")) {
    return "Guardian";
  }
  if (roles.includes("player")) return "Player";
  return "Member";
}
