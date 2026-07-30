import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getViewerContext } from "@/lib/authz/context";
import type {
  Team,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Team };

export const ACTIVE_TEAM_COOKIE = "fto_active_team";

/** All teams the signed-in user can see (RLS-filtered), ordered by name. */
export const listVisibleTeams = cache(
  async (): Promise<{ data: Team[]; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  },
);

/**
 * The active team for team-scoped screens. Resolved from the active-team cookie
 * when it points at a team the user can see; otherwise the first visible team.
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

  return teams[0];
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

  if (error) return { data: null, error: error.message };
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

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/** True when the active team is editable by the current user. */
export async function canEditActiveTeam(): Promise<boolean> {
  const [ctx, team] = await Promise.all([getViewerContext(), getActiveTeam()]);
  if (!ctx || !team) return false;
  return ctx.editableTeamIds.includes(team.id);
}
