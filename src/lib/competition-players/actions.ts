"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { canEditMatchDay, getViewerContext } from "@/lib/authz/context";
import { getCompetition } from "@/lib/data/competitions";
import { setCompetitionSquad } from "@/lib/data/competition-players";

export async function saveTournamentSquadAction(
  competitionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playerIds = formData
    .getAll("player_id")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const [ctx, loaded] = await Promise.all([
    getViewerContext(),
    getCompetition(competitionId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Competition not found." };
  if (loaded.data.kind !== "tournament") {
    return { error: "Squads can only be set for tournaments." };
  }
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return {
      error: "You do not have permission to edit the tournament squad.",
    };
  }

  const { error } = await setCompetitionSquad(competitionId, playerIds);
  if (error) return { error };

  revalidatePath(`/competitions/${competitionId}`);
  return { success: "Tournament squad saved." };
}
