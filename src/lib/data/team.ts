import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { canEditMatchDay, getViewerContext } from "@/lib/authz/context";
import type { AgeGroup } from "@/lib/constants";
import {
  isTeamArchived,
  isValidSeasonLabel,
  SEASON_FORMAT_HINT,
  sortTeamsForDisplay,
  archivedTeamReadOnlyError,
} from "@/lib/team/season";
import type {
  Team,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Team };
export { isTeamArchived, sortTeamsForDisplay };

export type StartNewTeamSeasonOptions = {
  seasonLabel: string;
  name?: string;
  displayName?: string | null;
  ageGroup?: AgeGroup;
  /** Copy squad links (shirt numbers / active) onto the successor. Default true. */
  migratePlayers?: boolean;
  /** Copy coaching staff roles onto the successor. Default true. */
  migrateCoaches?: boolean;
};

export const ACTIVE_TEAM_COOKIE = "fto_active_team";

const TEAM_NAME_SEASON_UNIQUE = "teams_club_name_season_uidx";

function mapTeamWriteError(message: string): string {
  if (message.includes(TEAM_NAME_SEASON_UNIQUE)) {
    return "A team with this name and season already exists in the club.";
  }
  return message;
}

/** All teams the signed-in user can see (RLS-filtered), ordered for display. */
export const listVisibleTeams = cache(
  async (): Promise<{ data: Team[]; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: sortTeamsForDisplay(data ?? []), error: null };
  },
);

/**
 * The active team for team-scoped screens. Resolved from the active-team cookie
 * when it points at a team the user can see; otherwise the first visible
 * non-archived team (falling back to any visible team).
 */
export const getActiveTeam = cache(async (): Promise<Team | null> => {
  const { data: teams } = await listVisibleTeams();
  if (teams.length === 0) return null;

  const cookieStore = await cookies();
  const cookieTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
  if (cookieTeamId) {
    const match = teams.find((team) => team.id === cookieTeamId);
    if (match) return match;
  }

  return teams.find((team) => !isTeamArchived(team)) ?? teams[0];
});

/** Backwards-compatible alias used across the app for the current team. */
export const getCurrentTeam = getActiveTeam;

export async function getTeam(
  id: string,
): Promise<{ data: Team | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateTeam(
  id: string,
  input: TablesUpdate<"teams">,
): Promise<{ data: Team | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: mapTeamWriteError(error.message) };
  return { data, error: null };
}

export async function createTeam(
  input: TablesInsert<"teams">,
): Promise<{ data: Team | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: mapTeamWriteError(error.message) };
  return { data, error: null };
}

/** Soft-archive a season team so historical data remain available. */
export async function archiveTeam(
  id: string,
): Promise<{ data: Team | null; error: string | null }> {
  return updateTeam(id, { archived_at: new Date().toISOString() });
}

/** Clear archive so the season team is treated as current again. */
export async function unarchiveTeam(
  id: string,
): Promise<{ data: Team | null; error: string | null }> {
  return updateTeam(id, { archived_at: null });
}

/**
 * Open a new season: archive the source (if needed), create a successor team,
 * optionally migrate squad and coaching staff, and always copy coach/management
 * app access. Matches stay on the archived season record.
 */
export async function startNewTeamSeason(
  source: Team,
  options: StartNewTeamSeasonOptions | string,
): Promise<{ data: Team | null; error: string | null }> {
  const opts: StartNewTeamSeasonOptions =
    typeof options === "string" ? { seasonLabel: options } : options;

  const season_label = opts.seasonLabel.trim();
  const name = (opts.name ?? source.name).trim();
  const display_name =
    opts.displayName === undefined
      ? source.display_name
      : opts.displayName?.trim() || null;
  const age_group = opts.ageGroup ?? source.age_group;
  const migratePlayers = opts.migratePlayers !== false;
  const migrateCoaches = opts.migrateCoaches !== false;

  if (!season_label) {
    return { data: null, error: "Season is required." };
  }
  if (!isValidSeasonLabel(season_label)) {
    return { data: null, error: SEASON_FORMAT_HINT };
  }
  if (season_label === source.season_label) {
    return {
      data: null,
      error: "Enter a new season label that differs from the current season.",
    };
  }
  if (!name) {
    return { data: null, error: "Team name is required." };
  }

  // Create the successor first so a uniqueness failure does not archive the
  // current season without a replacement.
  const created = await createTeam({
    club_id: source.club_id,
    name,
    display_name,
    age_group,
    gender: source.gender,
    home_venue_id: source.home_venue_id,
    training_venue_id: source.training_venue_id,
    training_days: source.training_days,
    season_label,
    photo_url: source.photo_url,
  });
  if (created.error || !created.data) {
    return { data: null, error: created.error ?? "Could not create team." };
  }

  const supabase = await createClient();
  const successorId = created.data.id;

  const [
    { data: coaches, error: coachesError },
    { data: members, error: membersError },
    { data: players, error: playersError },
  ] = await Promise.all([
    migrateCoaches
      ? supabase
          .from("team_coaches")
          .select("coach_id, role")
          .eq("team_id", source.id)
      : Promise.resolve({
          data: [] as { coach_id: string; role: string }[],
          error: null,
        }),
    supabase
      .from("team_members")
      .select("user_id, role")
      .eq("team_id", source.id)
      .in("role", ["coach", "management"]),
    migratePlayers
      ? supabase
          .from("team_players")
          .select("player_id, shirt_number, active")
          .eq("team_id", source.id)
      : Promise.resolve({
          data: [] as {
            player_id: string;
            shirt_number: number | null;
            active: boolean;
          }[],
          error: null,
        }),
  ]);

  if (coachesError) {
    return { data: null, error: coachesError.message };
  }
  if (membersError) {
    return { data: null, error: membersError.message };
  }
  if (playersError) {
    return { data: null, error: playersError.message };
  }

  if (coaches && coaches.length > 0) {
    const { error } = await supabase.from("team_coaches").insert(
      coaches.map((row) => ({
        team_id: successorId,
        coach_id: row.coach_id,
        role: row.role,
      })),
    );
    if (error) return { data: null, error: error.message };
  }

  if (members && members.length > 0) {
    const { error } = await supabase.from("team_members").insert(
      members.map((row) => ({
        team_id: successorId,
        user_id: row.user_id,
        role: row.role,
      })),
    );
    if (error) return { data: null, error: error.message };
  }

  if (players && players.length > 0) {
    const { error } = await supabase.from("team_players").insert(
      players.map((row) => ({
        team_id: successorId,
        player_id: row.player_id,
        shirt_number: row.shirt_number,
        active: row.active,
      })),
    );
    if (error) return { data: null, error: error.message };
  }

  if (!isTeamArchived(source)) {
    const archived = await archiveTeam(source.id);
    if (archived.error) return { data: null, error: archived.error };
  }

  return { data: created.data, error: null };
}

/** True when the active team is editable by the current user. */
export async function canEditActiveTeam(): Promise<boolean> {
  const [ctx, team] = await Promise.all([getViewerContext(), getActiveTeam()]);
  if (!ctx || !team) return false;
  if (isTeamArchived(team)) return false;
  return ctx.editableTeamIds.includes(team.id);
}

/** True when the user can record fixtures and match-day events for the active team. */
export async function canEditActiveMatchDay(): Promise<boolean> {
  const [ctx, team] = await Promise.all([getViewerContext(), getActiveTeam()]);
  if (!ctx || !team) return false;
  return canEditMatchDay(ctx, team.id);
}

/** Error when the team is archived; otherwise null. */
export async function assertTeamDataMutable(
  teamId: string,
): Promise<string | null> {
  const { data, error } = await getTeam(teamId);
  if (error) return error;
  return archivedTeamReadOnlyError(data);
}
