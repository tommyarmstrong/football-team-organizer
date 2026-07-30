"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  createPeriod,
  deletePeriod,
  setPeriodStarters,
  updatePeriod,
} from "@/lib/data/match-periods";
import { str } from "@/lib/form-parse";

function revalidateMatch(matchId: string) {
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function createPeriodAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = str(formData, "name");
  if (!name) return { error: "Period name is required." };

  const sortRaw = str(formData, "sort_order");
  const sort_order = sortRaw ? Number(sortRaw) : 0;
  if (!Number.isInteger(sort_order) || sort_order < 0) {
    return { error: "Sort order must be zero or a positive whole number." };
  }

  const { error } = await createPeriod({
    match_id: matchId,
    name,
    sort_order,
  });
  if (error) return { error };

  revalidateMatch(matchId);
  return { success: "Period added." };
}

export async function updatePeriodAction(
  matchId: string,
  periodId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = str(formData, "name");
  if (!name) return { error: "Period name is required." };

  const sortRaw = str(formData, "sort_order");
  const sort_order = sortRaw ? Number(sortRaw) : 0;
  if (!Number.isInteger(sort_order) || sort_order < 0) {
    return { error: "Sort order must be zero or a positive whole number." };
  }

  const { error } = await updatePeriod(periodId, { name, sort_order });
  if (error) return { error };

  revalidateMatch(matchId);
  return { success: "Period saved." };
}

export async function deletePeriodAction(
  matchId: string,
  periodId: string,
): Promise<ActionState> {
  const { error } = await deletePeriod(periodId);
  if (error) return { error };

  revalidateMatch(matchId);
  return { success: "Period removed." };
}

export async function savePeriodStartersAction(
  matchId: string,
  periodId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playerIds = formData
    .getAll("player_id")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const { error } = await setPeriodStarters(periodId, playerIds);
  if (error) return { error };

  revalidateMatch(matchId);
  return { success: "Starting players saved." };
}
