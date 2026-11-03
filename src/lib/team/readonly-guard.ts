import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/supabase/relations";
import { archivedTeamWriteError } from "@/lib/team/season";

export async function rejectIfTeamArchived(
  teamId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("archived_at")
    .eq("id", teamId)
    .maybeSingle();
  if (error) return error.message;
  if (!team) return "Team not found.";
  return archivedTeamWriteError(team);
}

export type MatchTeamState = {
  team_id: string;
  /** Null when the team row is not visible to the caller. */
  team: { archived_at: string | null } | null;
};

/**
 * A match's team id and archive state in one round-trip (the match row with
 * its team embedded), instead of loading the match and then the team.
 */
export async function loadMatchTeamState(
  matchId: string,
): Promise<{ data: MatchTeamState | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("team_id, team:teams(archived_at)")
    .eq("id", matchId)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: { team_id: data.team_id, team: one(data.team) },
    error: null,
  };
}

export async function rejectIfMatchTeamArchived(
  matchId: string,
): Promise<string | null> {
  const { data, error } = await loadMatchTeamState(matchId);
  if (error) return error;
  if (!data) return "Match not found.";
  if (!data.team) return "Team not found.";
  return archivedTeamWriteError(data.team);
}
