"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { isMatchPeriodName, matchPeriodSortOrder } from "@/lib/constants";
import { listMatchPlayers } from "@/lib/data/match-players";
import {
  createPeriod,
  deletePeriod,
  setPeriodStarters,
  updatePeriod,
} from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { str } from "@/lib/form-parse";

function revalidateMatch(matchId: string, periodId?: string) {
  revalidatePath(`/matches/${matchId}`);
  if (periodId) {
    revalidatePath(`/matches/${matchId}/periods/${periodId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

async function defaultStarterPlayerIds(matchId: string): Promise<string[]> {
  const { data: matchPlayers, error: matchPlayersError } =
    await listMatchPlayers(matchId);
  if (matchPlayersError) return [];
  if (matchPlayers.length > 0) {
    return matchPlayers.map((row) => row.player_id);
  }

  const { data: match } = await getMatch(matchId);
  if (!match) return [];

  const { data: roster } = await listRosterForTeam(match.team_id);
  return roster.map((player) => player.id);
}

function parsePeriodName(formData: FormData): ActionState | string {
  const name = str(formData, "name");
  if (!name) return { error: "Period name is required." };
  if (!isMatchPeriodName(name)) {
    return { error: "Choose a valid period from the list." };
  }
  return name;
}

export async function createPeriodAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parsePeriodName(formData);
  if (typeof parsed !== "string") return parsed;

  const { data, error } = await createPeriod({
    match_id: matchId,
    name: parsed,
    sort_order: matchPeriodSortOrder(parsed),
  });
  if (error) return { error };
  if (!data) return { error: "Could not create period." };

  // Default starters: match-day squad, or active roster if no squad is set.
  const starterIds = await defaultStarterPlayerIds(matchId);
  if (starterIds.length > 0) {
    const { error: startersError } = await setPeriodStarters(
      data.id,
      starterIds,
    );
    if (startersError) return { error: startersError };
  }

  revalidateMatch(matchId, data.id);
  redirect(`/matches/${matchId}/periods/${data.id}`);
}

/** Saves period name/order and returns to the match page. */
export async function savePeriodAndReturnToMatchAction(
  matchId: string,
  periodId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parsePeriodName(formData);
  if (typeof parsed !== "string") return parsed;

  const { error } = await updatePeriod(periodId, {
    name: parsed,
    sort_order: matchPeriodSortOrder(parsed),
  });
  if (error) return { error };

  revalidateMatch(matchId, periodId);
  redirect(`/matches/${matchId}`);
}

export async function deletePeriodAction(
  matchId: string,
  periodId: string,
): Promise<ActionState> {
  const { error } = await deletePeriod(periodId);
  if (error) return { error };

  revalidateMatch(matchId);
  return {};
}

export async function deletePeriodAndReturnToMatchAction(
  matchId: string,
  periodId: string,
): Promise<ActionState> {
  const result = await deletePeriodAction(matchId, periodId);
  if (result.error) return result;
  redirect(`/matches/${matchId}`);
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

  revalidateMatch(matchId, periodId);
  return { success: "Starting players saved." };
}
