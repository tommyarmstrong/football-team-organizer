import { createClient } from "@/lib/supabase/server";
import { matchAllowsEvents } from "@/lib/constants";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
  type NamedPlayer,
} from "@/lib/people/named-player";
import type {
  Goal,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type GoalWithPlayers = Goal & {
  scorer: NamedPlayer | null;
  assist: NamedPlayer | null;
};

const GOAL_SELECT = `*, scorer:players!goals_player_id_fkey(${PLAYER_NAME_EMBED}), assist:players!goals_assist_player_id_fkey(${PLAYER_NAME_EMBED})`;

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
  scorer: unknown;
  assist: unknown;
}): GoalWithPlayers {
  const scorerRaw = Array.isArray(row.scorer) ? row.scorer[0] : row.scorer;
  const assistRaw = Array.isArray(row.assist) ? row.assist[0] : row.assist;
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
    scorer: mapPlayerNameEmbed(
      scorerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    ),
    assist: mapPlayerNameEmbed(
      assistRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    ),
  };
}

export async function listGoalsForMatch(
  matchId: string,
): Promise<{ data: GoalWithPlayers[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .eq("match_id", matchId)
    .order("minute", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map((row) =>
      mapGoalRow(row as Parameters<typeof mapGoalRow>[0]),
    ),
    error: null,
  };
}

export async function getGoal(
  goalId: string,
): Promise<{ data: GoalWithPlayers | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_SELECT)
    .eq("id", goalId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return {
    data: mapGoalRow(data as Parameters<typeof mapGoalRow>[0]),
    error: null,
  };
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
