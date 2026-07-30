"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  MATCH_HOME_AWAYS,
  MATCH_STATUSES,
  matchAllowsEvents,
} from "@/lib/constants";
import { createMatch, updateMatch } from "@/lib/data/matches";
import { getActiveTeam } from "@/lib/data/team";
import { listVenues } from "@/lib/data/venues";
import { parseOptionalInt, str } from "@/lib/form-parse";
import type { MatchHomeAway, MatchStatus } from "@/lib/supabase/database.types";

async function parseVenueId(
  formData: FormData,
  clubId: string,
): Promise<{ venue_id: string | null } | { error: string }> {
  const venue_id = str(formData, "venue_id") || null;
  if (!venue_id) return { venue_id: null };

  const { data: venues, error } = await listVenues(clubId);
  if (error) return { error };
  if (!venues.some((venue) => venue.id === venue_id)) {
    return { error: "Invalid venue." };
  }
  return { venue_id };
}

export async function createMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const opponent_name = str(formData, "opponent_name");
  const date = str(formData, "date");
  const kickoff_time = str(formData, "kickoff_time") || null;
  const home_away = str(formData, "home_away") as MatchHomeAway;
  const competition_id = str(formData, "competition_id") || null;
  const notes = str(formData, "notes") || null;
  const club_notes = str(formData, "club_notes") || null;

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_HOME_AWAYS.includes(home_away)) {
    return { error: "Invalid home/away value." };
  }

  const team = await getActiveTeam();
  if (!team) return { error: "No team selected." };

  const venueResult = await parseVenueId(formData, team.club_id);
  if ("error" in venueResult) return { error: venueResult.error };

  const { data, error } = await createMatch({
    opponent_name,
    date,
    kickoff_time,
    home_away,
    venue_id: venueResult.venue_id,
    competition_id,
    notes,
    club_notes,
    status: "scheduled",
    goals_for: null,
    goals_against: null,
    player_of_the_match_id: null,
    players_player_of_the_match_id: null,
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
  const home_away = str(formData, "home_away") as MatchHomeAway;
  const status = str(formData, "status") as MatchStatus;
  const competition_id = str(formData, "competition_id") || null;
  const player_of_the_match_id =
    str(formData, "player_of_the_match_id") || null;
  const players_player_of_the_match_id =
    str(formData, "players_player_of_the_match_id") || null;
  const notes = str(formData, "notes") || null;
  const club_notes = str(formData, "club_notes") || null;

  const goalsForRaw = parseOptionalInt(str(formData, "goals_for"), "Goals for");
  const goalsAgainstRaw = parseOptionalInt(
    str(formData, "goals_against"),
    "Goals against",
  );

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_HOME_AWAYS.includes(home_away)) {
    return { error: "Invalid home/away value." };
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

  const team = await getActiveTeam();
  if (!team) return { error: "No team selected." };

  const venueResult = await parseVenueId(formData, team.club_id);
  if ("error" in venueResult) return { error: venueResult.error };

  let goals_for = goalsForRaw as number | null;
  let goals_against = goalsAgainstRaw as number | null;
  const allowsEvents = matchAllowsEvents(status);

  if (status === "played") {
    if (goals_for == null || goals_against == null) {
      return {
        error: "Goals for and against are required when status is played.",
      };
    }
  } else if (!allowsEvents) {
    goals_for = null;
    goals_against = null;
  }

  const { error } = await updateMatch(id, {
    opponent_name,
    date,
    kickoff_time,
    home_away,
    venue_id: venueResult.venue_id,
    status,
    competition_id,
    player_of_the_match_id: allowsEvents ? player_of_the_match_id : null,
    players_player_of_the_match_id: allowsEvents
      ? players_player_of_the_match_id
      : null,
    notes,
    club_notes,
    goals_for,
    goals_against,
  });

  if (error) return { error };

  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  return { success: "Match saved." };
}
