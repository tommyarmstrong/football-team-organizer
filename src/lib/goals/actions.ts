"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { createGoal, deleteGoal, updateGoal } from "@/lib/data/goals";
import { createClient } from "@/lib/supabase/server";
import { boolFromCheckbox, parseOptionalMinute, str } from "@/lib/form-parse";

async function resolvePeriodFields(
  matchId: string,
  formData: FormData,
): Promise<
  | { period_id: string | null; period: string | null; error?: undefined }
  | { error: string }
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

  // Always sync the denormalized text label from the period entity.
  period = data.name;
  return { period_id, period };
}

export async function createGoalAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const player_id = str(formData, "player_id");
  const assist_player_id = str(formData, "assist_player_id") || null;
  const minute = parseOptionalMinute(str(formData, "minute"));

  if (!player_id) {
    return { error: "Select a scorer." };
  }
  if (minute && typeof minute === "object" && "error" in minute) {
    return { error: minute.error };
  }
  if (assist_player_id && assist_player_id === player_id) {
    return { error: "Assist player must be different from the scorer." };
  }

  const periodFields = await resolvePeriodFields(matchId, formData);
  if ("error" in periodFields) {
    return { error: periodFields.error };
  }

  const { error } = await createGoal({
    match_id: matchId,
    player_id,
    assist_player_id,
    period_id: periodFields.period_id,
    period: periodFields.period,
    minute: minute as number | null,
    is_penalty: boolFromCheckbox(formData, "is_penalty"),
    is_freekick: boolFromCheckbox(formData, "is_freekick"),
    from_setpiece: boolFromCheckbox(formData, "from_setpiece"),
  });

  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  return { success: "Goal added." };
}

export async function updateGoalAction(
  matchId: string,
  goalId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const player_id = str(formData, "player_id");
  const assist_player_id = str(formData, "assist_player_id") || null;
  const minute = parseOptionalMinute(str(formData, "minute"));

  if (!player_id) {
    return { error: "Select a scorer." };
  }
  if (minute && typeof minute === "object" && "error" in minute) {
    return { error: minute.error };
  }
  if (assist_player_id && assist_player_id === player_id) {
    return { error: "Assist player must be different from the scorer." };
  }

  const periodFields = await resolvePeriodFields(matchId, formData);
  if ("error" in periodFields) {
    return { error: periodFields.error };
  }

  const { error } = await updateGoal(goalId, {
    player_id,
    assist_player_id,
    period_id: periodFields.period_id,
    period: periodFields.period,
    minute: minute as number | null,
    is_penalty: boolFromCheckbox(formData, "is_penalty"),
    is_freekick: boolFromCheckbox(formData, "is_freekick"),
    from_setpiece: boolFromCheckbox(formData, "from_setpiece"),
  });

  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  return { success: "Goal updated." };
}

export async function deleteGoalAction(
  matchId: string,
  goalId: string,
): Promise<ActionState> {
  const { error } = await deleteGoal(goalId);
  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  return { success: "Goal removed." };
}
