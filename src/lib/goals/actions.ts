"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  OPPOSITION_SCORER_VALUE,
  OWN_GOAL_SCORER_VALUE,
} from "@/lib/constants";
import { createGoal, deleteGoal, updateGoal } from "@/lib/data/goals";
import { createClient } from "@/lib/supabase/server";
import {
  goalAssistsAllowed,
  parseGoalKind,
  parseOptionalMinute,
  str,
} from "@/lib/form-parse";

function revalidateGoal(matchId: string, goalId?: string) {
  revalidatePath(`/matches/${matchId}`);
  if (goalId) {
    revalidatePath(`/matches/${matchId}/goals/${goalId}`);
  }
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
}

async function resolvePeriodFields(
  matchId: string,
  formData: FormData,
): Promise<
  { period_id: string | null; period: string | null } | { error: string }
> {
  const period_id = str(formData, "period_id") || null;
  let period = str(formData, "period") || null;

  if (!period_id) {
    return { period_id: null, period };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_periods")
    .select("id, match_id, name")
    .eq("id", period_id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Period not found." };
  if (data.match_id !== matchId) {
    return { error: "Period does not belong to this match." };
  }

  period = data.name;
  return { period_id, period };
}

type ParsedScorer =
  | { is_opposition: true; is_own_goal: false; player_id: null }
  | { is_opposition: false; is_own_goal: true; player_id: null }
  | { is_opposition: false; is_own_goal: false; player_id: string };

function parseScorer(formData: FormData): ParsedScorer | { error: string } {
  const raw = str(formData, "player_id");
  if (!raw) {
    return { error: "Select a scorer." };
  }
  if (raw === OPPOSITION_SCORER_VALUE) {
    return { is_opposition: true, is_own_goal: false, player_id: null };
  }
  if (raw === OWN_GOAL_SCORER_VALUE) {
    return { is_opposition: false, is_own_goal: true, player_id: null };
  }
  return { is_opposition: false, is_own_goal: false, player_id: raw };
}

async function parseGoalFields(
  matchId: string,
  formData: FormData,
): Promise<
  | {
      player_id: string | null;
      assist_player_id: string | null;
      is_opposition: boolean;
      is_own_goal: boolean;
      period_id: string | null;
      period: string | null;
      minute: number | null;
      is_penalty: boolean;
      is_freekick: boolean;
      from_setpiece: boolean;
    }
  | { error: string }
> {
  const scorer = parseScorer(formData);
  if ("error" in scorer) return scorer;

  const kind = parseGoalKind(formData);
  if ("error" in kind) return kind;

  const allowAssist = goalAssistsAllowed(scorer, kind);
  const assist_player_id = allowAssist
    ? str(formData, "assist_player_id") || null
    : null;
  const minute = parseOptionalMinute(str(formData, "minute"));

  if (minute && typeof minute === "object" && "error" in minute) {
    return { error: minute.error };
  }
  if (
    allowAssist &&
    assist_player_id &&
    assist_player_id === scorer.player_id
  ) {
    return { error: "Assist player must be different from the scorer." };
  }

  const periodFields = await resolvePeriodFields(matchId, formData);
  if ("error" in periodFields) {
    return { error: periodFields.error };
  }

  return {
    player_id: scorer.player_id,
    assist_player_id,
    is_opposition: scorer.is_opposition,
    is_own_goal: scorer.is_own_goal,
    period_id: periodFields.period_id,
    period: periodFields.period,
    minute: minute as number | null,
    is_penalty: kind.is_penalty,
    is_freekick: kind.is_freekick,
    from_setpiece: kind.from_setpiece,
  };
}

export async function createGoalAndReturnToMatchAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = await parseGoalFields(matchId, formData);
  if ("error" in parsed) return parsed;

  const { data, error } = await createGoal({
    match_id: matchId,
    ...parsed,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create goal." };

  revalidateGoal(matchId, data.id);
  redirect(`/matches/${matchId}`);
}

export async function saveGoalAndReturnToMatchAction(
  matchId: string,
  goalId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = await parseGoalFields(matchId, formData);
  if ("error" in parsed) return parsed;

  const { error } = await updateGoal(goalId, parsed);
  if (error) return { error };

  revalidateGoal(matchId, goalId);
  redirect(`/matches/${matchId}`);
}

export async function deleteGoalAction(
  matchId: string,
  goalId: string,
): Promise<ActionState> {
  const { error } = await deleteGoal(goalId);
  if (error) return { error };

  revalidateGoal(matchId);
  return {};
}

export async function deleteGoalAndReturnToMatchAction(
  matchId: string,
  goalId: string,
): Promise<ActionState> {
  const result = await deleteGoalAction(matchId, goalId);
  if (result.error) return result;
  redirect(`/matches/${matchId}`);
}
