"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  createPlayerOfTheMonth,
  deletePlayerOfTheMonth,
  updatePlayerOfTheMonth,
} from "@/lib/data/player-of-the-month";
import { str } from "@/lib/form-parse";

function parseMonth(raw: string): string | { error: string } {
  const value = raw.trim();
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return { error: "Month must be in YYYY-MM format." };
  }
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) {
    return { error: "Invalid month." };
  }
  return `${value}-01`;
}

function parseAwardForm(
  formData: FormData,
):
  | { player_id: string; month: string; notes: string | null }
  | { error: string } {
  const player_id = str(formData, "player_id");
  if (!player_id) return { error: "Select a player." };

  const monthParsed = parseMonth(str(formData, "month"));
  if (typeof monthParsed === "object") return monthParsed;

  const notes = str(formData, "notes") || null;
  return { player_id, month: monthParsed, notes };
}

function revalidateAwardPaths(id?: string) {
  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/player-of-the-month/new");
  if (id) {
    revalidatePath(`/player-of-the-month/${id}`);
    revalidatePath(`/player-of-the-month/${id}/edit`);
  }
}

export async function createPlayerOfTheMonthAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAwardForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createPlayerOfTheMonth(parsed);
  if (error) return { error };
  if (!data) return { error: "Could not create player of the month." };

  revalidateAwardPaths(data.id);
  redirect("/team");
}

export async function updatePlayerOfTheMonthAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAwardForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updatePlayerOfTheMonth(id, parsed);
  if (error) return { error };

  revalidateAwardPaths(id);
  redirect("/team");
}

export async function deletePlayerOfTheMonthAction(
  id: string,
): Promise<ActionState> {
  const { error } = await deletePlayerOfTheMonth(id);
  if (error) return { error };

  revalidateAwardPaths(id);
  redirect("/team");
}
