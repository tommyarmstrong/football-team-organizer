"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { createGoal, deleteGoal, updateGoal } from "@/lib/data/goals";
import { boolFromCheckbox, parseOptionalMinute, str } from "@/lib/form-parse";

export async function createGoalAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const player_id = str(formData, "player_id");
  const assist_player_id = str(formData, "assist_player_id") || null;
  const period = str(formData, "period") || null;
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

  const { error } = await createGoal({
    match_id: matchId,
    player_id,
    assist_player_id,
    period,
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
  const period = str(formData, "period") || null;
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

  const { error } = await updateGoal(goalId, {
    player_id,
    assist_player_id,
    period,
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
