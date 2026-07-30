import { createClient } from "@/lib/supabase/server";
import { matchAllowsEvents } from "@/lib/constants";
import type {
  Goal,
  Player,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type GoalWithPlayers = Goal & {
  scorer: Pick<Player, "id" | "first_name" | "last_name">;
  assist: Pick<Player, "id" | "first_name" | "last_name"> | null;
};

export async function listGoalsForMatch(
  matchId: string,
): Promise<{ data: GoalWithPlayers[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select(
      "*, scorer:players!goals_player_id_fkey(id, first_name, last_name), assist:players!goals_assist_player_id_fkey(id, first_name, last_name)",
    )
    .eq("match_id", matchId)
    .order("minute", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []).map((row) => {
    const scorer = Array.isArray(row.scorer) ? row.scorer[0] : row.scorer;
    const assist = Array.isArray(row.assist)
      ? (row.assist[0] ?? null)
      : row.assist;
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
      scorer: scorer!,
      assist,
    };
  });

  return { data: rows, error: null };
}

export async function createGoal(
  input: TablesInsert<"goals">,
): Promise<{ data: Goal | null; error: string | null }> {
  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", input.match_id)
    .maybeSingle();

  if (matchError) return { data: null, error: matchError.message };
  if (!match) return { data: null, error: "Match not found." };
  if (!matchAllowsEvents(match.status)) {
    return {
      data: null,
      error: "Goals can only be added when the match is in progress or played.",
    };
  }

  const { data, error } = await supabase
    .from("goals")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: friendlyGoalError(error.message) };
  return { data, error: null };
}

export async function updateGoal(
  id: string,
  input: TablesUpdate<"goals">,
): Promise<{ data: Goal | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: friendlyGoalError(error.message) };
  return { data, error: null };
}

export async function deleteGoal(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  return { error: error?.message ?? null };
}

function friendlyGoalError(message: string): string {
  if (message.includes("goals_assist_not_scorer")) {
    return "Assist player must be different from the scorer.";
  }
  return message;
}
