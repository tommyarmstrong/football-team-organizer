import { createClient } from "@/lib/supabase/server";
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

export async function rejectIfMatchTeamArchived(
  matchId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select("team_id")
    .eq("id", matchId)
    .maybeSingle();
  if (error) return error.message;
  if (!match) return "Match not found.";
  return rejectIfTeamArchived(match.team_id);
}
