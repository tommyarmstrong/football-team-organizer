"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canEditMatchDay, getViewerContext } from "@/lib/authz/context";
import {
  isExtraTimeOrPenaltyPeriodName,
  isMatchPeriodName,
  matchAllowsEvents,
  matchPeriodSortOrder,
} from "@/lib/constants";
import {
  createPeriod,
  deletePeriod,
  getPeriod,
  listPeriodsForMatch,
  setPeriodStarters,
  updatePeriod,
} from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { str } from "@/lib/form-parse";

function revalidateMatch(matchId: string, periodId?: string) {
  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}/periods/new`);
  if (periodId) {
    revalidatePath(`/matches/${matchId}/periods/${periodId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

function parsePeriodName(formData: FormData): ActionState | string {
  const name = str(formData, "name");
  if (!name) return { error: "Period name is required." };
  if (!isMatchPeriodName(name)) {
    return { error: "Choose a valid period from the list." };
  }
  return name;
}

function parseStarterPlayerIds(formData: FormData): string[] {
  return formData
    .getAll("player_id")
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function createPeriodAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parsePeriodName(formData);
  if (typeof parsed !== "string") return parsed;
  if (!isExtraTimeOrPenaltyPeriodName(parsed)) {
    return {
      error: "Only extra time or a penalty shootout can be added.",
    };
  }

  const [ctx, loaded, existing] = await Promise.all([
    getViewerContext(),
    getMatch(matchId),
    listPeriodsForMatch(matchId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to edit this match." };
  }
  if (!matchAllowsEvents(loaded.data.status)) {
    return {
      error:
        "Extra time and penalties can only be added when the match is in progress or played.",
    };
  }
  if (existing.error) return { error: existing.error };
  if (existing.data.some((period) => period.name === parsed)) {
    return { error: `${parsed} is already on this match.` };
  }

  const { data, error } = await createPeriod({
    match_id: matchId,
    name: parsed,
    sort_order: matchPeriodSortOrder(parsed),
  });
  if (error) return { error };
  if (!data) return { error: "Could not create period." };

  const starterIds = parseStarterPlayerIds(formData);
  if (starterIds.length > 0) {
    const { error: startersError } = await setPeriodStarters(
      data.id,
      starterIds,
    );
    if (startersError) return { error: startersError };
  }

  revalidateMatch(matchId, data.id);
  redirect(`/matches/${matchId}`);
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

  const [ctx, loaded, periodLoaded, existing] = await Promise.all([
    getViewerContext(),
    getMatch(matchId),
    getPeriod(periodId),
    listPeriodsForMatch(matchId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to edit this match." };
  }
  if (periodLoaded.error) return { error: periodLoaded.error };
  if (!periodLoaded.data || periodLoaded.data.match_id !== matchId) {
    return { error: "Period not found." };
  }
  if (existing.error) return { error: existing.error };

  if (parsed !== periodLoaded.data.name) {
    if (
      !isExtraTimeOrPenaltyPeriodName(periodLoaded.data.name) ||
      !isExtraTimeOrPenaltyPeriodName(parsed)
    ) {
      return {
        error: "Regulation periods cannot be changed to another period type.",
      };
    }
    if (existing.data.some((period) => period.name === parsed)) {
      return { error: `${parsed} is already on this match.` };
    }
  }

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
  const [ctx, loaded] = await Promise.all([
    getViewerContext(),
    getMatch(matchId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to edit this match." };
  }

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
  const [ctx, loaded] = await Promise.all([
    getViewerContext(),
    getMatch(matchId),
  ]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to edit this match." };
  }

  const playerIds = parseStarterPlayerIds(formData);
  const { error } = await setPeriodStarters(periodId, playerIds);
  if (error) return { error };

  revalidateMatch(matchId, periodId);
  return { success: "Starting players saved." };
}
