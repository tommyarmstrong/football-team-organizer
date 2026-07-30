"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { setMatchSquad } from "@/lib/data/match-players";

export async function saveMatchSquadAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playerIds = formData
    .getAll("player_id")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const { error } = await setMatchSquad(matchId, playerIds);
  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  return { success: "Match-day squad saved." };
}
