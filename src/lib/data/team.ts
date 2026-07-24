import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Team,
  TeamMember,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type TeamMembership = TeamMember & {
  team: Team;
};

export type { Team };

/**
 * Returns the signed-in user's first team membership (MVP: one team).
 * Relies on RLS so callers only see their own `team_members` rows.
 * Cached per request so parallel page data helpers share one lookup.
 */
export const getCurrentTeamMembership = cache(
  async (): Promise<TeamMembership | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("team_members")
      .select("*, team:teams(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const { team, ...membership } = data;
    if (!team || Array.isArray(team)) {
      return null;
    }

    return { ...membership, team };
  },
);

/** True when the signed-in user has at least one coach/admin membership. */
export async function userHasTeamAccess(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { count, error } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return !error && (count ?? 0) > 0;
}

/** MVP helper: the single team for the current coach/admin, if any. */
export const getCurrentTeam = cache(async (): Promise<Team | null> => {
  const membership = await getCurrentTeamMembership();
  return membership?.team ?? null;
});

export async function updateCurrentTeam(
  input: TablesUpdate<"teams">,
): Promise<{ data: Team | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", team.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
