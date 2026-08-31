"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { canEditMatchDay, getViewerContext } from "@/lib/authz/context";
import { getMatch } from "@/lib/data/matches";
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

  const [ctx, loaded] = await Promise.all([
    getViewerContext(),
    getMatch(matchId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to edit the match-day squad." };
  }

  const { error } = await setMatchSquad(matchId, playerIds);
  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  return { success: "Match-day squad saved." };
}
