import { createClient } from "@/lib/supabase/server";
import { matchAllowsEvents } from "@/lib/constants";
import type {
  Goal,
  Player,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type GoalWithPlayers = Goal & {
  scorer: Pick<Player, "id" | "first_name" | "last_name"> | null;
  assist: Pick<Player, "id" | "first_name" | "last_name"> | null;
};

function mapGoalRow(row: {
  id: string;
  match_id: string;
  player_id: string | null;
  assist_player_id: string | null;
  period: string | null;
  period_id: string | null;
  minute: number | null;
  is_penalty: boolean;
  is_freekick: boolean;
  from_setpiece: boolean;
  is_opposition: boolean;
  is_own_goal: boolean;
  created_at: string;
  scorer:
    | Pick<Player, "id" | "first_name" | "last_name">
    | Pick<Player, "id" | "first_name" | "last_name">[]
    | null;
  assist:
    | Pick<Player, "id" | "first_name" | "last_name">
    | Pick<Player, "id" | "first_name" | "last_name">[]
    | null;
}): GoalWithPlayers {
  const scorer = Array.isArray(row.scorer)
    ? (row.scorer[0] ?? null)
    : row.scorer;
  const assist = Array.isArray(row.assist)
    ? (row.assist[0] ?? null)
    : row.assist;
  return {
    id: row.id,
    match_id: row.match_id,
    player_id: row.player_id,
    assist_player_id: row.assist_player_id,
    period: row.period,
    period_id: row.period_id,
    minute: row.minute,
    is_penalty: row.is_penalty,
    is_freekick: row.is_freekick,
    from_setpiece: row.from_setpiece,
    is_opposition: row.is_opposition,
    is_own_goal: row.is_own_goal,
    created_at: row.created_at,
    scorer,
    assist,
  };
}

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

  return { data: (data ?? []).map(mapGoalRow), error: null };
}

export async function getGoal(
  goalId: string,
): Promise<{ data: GoalWithPlayers | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select(
      "*, scorer:players!goals_player_id_fkey(id, first_name, last_name), assist:players!goals_assist_player_id_fkey(id, first_name, last_name)",
    )
    .eq("id", goalId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: mapGoalRow(data), error: null };
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
  if (
    message.includes("goals_opposition_scorer_consistency") ||
    message.includes("goals_scorer_consistency")
  ) {
    return "Goal scorer details are inconsistent.";
  }
  if (message.includes("goals_kind_mutually_exclusive")) {
    return "A goal can only be one of Penalty, Direct Free Kick, or Set Piece.";
  }
  return message;
}
