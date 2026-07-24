"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { MATCH_STATUSES, MATCH_VENUES } from "@/lib/constants";
import { createMatch, updateMatch } from "@/lib/data/matches";
import { parseOptionalInt, str } from "@/lib/form-parse";
import type { MatchStatus, MatchVenue } from "@/lib/supabase/database.types";

export async function createMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const opponent_name = str(formData, "opponent_name");
  const date = str(formData, "date");
  const kickoff_time = str(formData, "kickoff_time") || null;
  const venue = str(formData, "venue") as MatchVenue;
  const competition_id = str(formData, "competition_id") || null;
  const notes = str(formData, "notes") || null;

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_VENUES.includes(venue)) {
    return { error: "Invalid venue." };
  }

  const { data, error } = await createMatch({
    opponent_name,
    date,
    kickoff_time,
    venue,
    competition_id,
    notes,
    status: "scheduled",
    goals_for: null,
    goals_against: null,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create match." };

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  redirect(`/matches/${data.id}`);
}

export async function updateMatchAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const opponent_name = str(formData, "opponent_name");
  const date = str(formData, "date");
  const kickoff_time = str(formData, "kickoff_time") || null;
  const venue = str(formData, "venue") as MatchVenue;
  const status = str(formData, "status") as MatchStatus;
  const competition_id = str(formData, "competition_id") || null;
  const notes = str(formData, "notes") || null;

  const goalsForRaw = parseOptionalInt(str(formData, "goals_for"), "Goals for");
  const goalsAgainstRaw = parseOptionalInt(
    str(formData, "goals_against"),
    "Goals against",
  );

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_VENUES.includes(venue)) {
    return { error: "Invalid venue." };
  }
  if (!MATCH_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }
  if (
    goalsForRaw &&
    typeof goalsForRaw === "object" &&
    "error" in goalsForRaw
  ) {
    return { error: goalsForRaw.error };
  }
  if (
    goalsAgainstRaw &&
    typeof goalsAgainstRaw === "object" &&
    "error" in goalsAgainstRaw
  ) {
    return { error: goalsAgainstRaw.error };
  }

  let goals_for = goalsForRaw as number | null;
  let goals_against = goalsAgainstRaw as number | null;

  if (status === "played") {
    if (goals_for == null || goals_against == null) {
      return {
        error: "Goals for and against are required when status is played.",
      };
    }
  } else {
    // Clearing score when leaving played is intentional (documented in UI).
    goals_for = null;
    goals_against = null;
  }

  const { error } = await updateMatch(id, {
    opponent_name,
    date,
    kickoff_time,
    venue,
    status,
    competition_id,
    notes,
    goals_for,
    goals_against,
  });

  if (error) return { error };

  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/players");
  return { success: "Match saved." };
}
