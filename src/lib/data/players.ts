import { createClient } from "@/lib/supabase/server";
import { getCurrentTeam } from "@/lib/data/team";
import type {
  Goal,
  Player,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Player };

export type PlayerWithGoalCount = Player & {
  goal_count: number;
};

export async function listActivePlayers(
  teamId?: string,
): Promise<{ data: Player[]; error: string | null }> {
  const team = teamId ? { id: teamId } : await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team.id)
    .eq("active", true)
    .order("shirt_number", { ascending: true, nullsFirst: false })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/** Active + inactive — useful for goal scorer picks on historical matches. */
export async function listPlayersForTeam(
  teamId?: string,
): Promise<{ data: Player[]; error: string | null }> {
  const team = teamId ? { id: teamId } : await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team.id)
    .order("active", { ascending: false })
    .order("shirt_number", { ascending: true, nullsFirst: false })
    .order("last_name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getPlayer(
  id: string,
): Promise<{ data: Player | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("team_id", team.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getPlayerGoals(
  playerId: string,
): Promise<{
  data: (Goal & { match_date: string; opponent_name: string })[];
  error: string | null;
}> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*, match:matches!inner(date, opponent_name, team_id, status)")
    .eq("player_id", playerId)
    .eq("match.team_id", team.id)
    .eq("match.status", "played")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = (data ?? []).map((row) => {
    const match = Array.isArray(row.match) ? row.match[0] : row.match;
    return {
      id: row.id,
      match_id: row.match_id,
      player_id: row.player_id,
      assist_player_id: row.assist_player_id,
      period: row.period,
      minute: row.minute,
      is_penalty: row.is_penalty,
      is_freekick: row.is_freekick,
      from_setpiece: row.from_setpiece,
      created_at: row.created_at,
      match_date: match?.date ?? "",
      opponent_name: match?.opponent_name ?? "",
    };
  });

  return { data: rows, error: null };
}

export async function createPlayer(
  input: Omit<TablesInsert<"players">, "team_id">,
): Promise<{ data: Player | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert({ ...input, team_id: team.id })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: friendlyPlayerError(error.message) };
  }

  return { data, error: null };
}

export async function updatePlayer(
  id: string,
  input: TablesUpdate<"players">,
): Promise<{ data: Player | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update(input)
    .eq("id", id)
    .eq("team_id", team.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: friendlyPlayerError(error.message) };
  }

  return { data, error: null };
}

export async function deactivatePlayer(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await updatePlayer(id, { active: false });
  return { error };
}

function friendlyPlayerError(message: string): string {
  if (message.includes("players_team_shirt_number_uidx")) {
    return "That shirt number is already used by another player.";
  }
  return message;
}
