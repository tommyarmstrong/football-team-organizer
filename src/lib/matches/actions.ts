"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  canEditMatchDay,
  canEditTeam,
  getViewerContext,
} from "@/lib/authz/context";
import {
  DEFAULT_MATCH_PERIODS,
  MATCH_HOME_AWAYS,
  MATCH_STATUSES,
  isCompetitionPeriods,
  matchAllowsEvents,
  periodNamesForCompetitionPeriods,
} from "@/lib/constants";
import {
  createMatch,
  deleteMatch,
  getMatch,
  updateMatch,
} from "@/lib/data/matches";
import { listMatchPlayers } from "@/lib/data/match-players";
import { createPeriodsWithStarters } from "@/lib/data/match-periods";
import { listRosterForTeam } from "@/lib/data/players";
import { getActiveTeam } from "@/lib/data/team";
import { listVenues } from "@/lib/data/venues";
import { str } from "@/lib/form-parse";
import type {
  CompetitionPeriods,
  MatchHomeAway,
  MatchStatus,
} from "@/lib/supabase/database.types";

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

async function defaultStarterPlayerIds(
  matchId: string,
  teamId: string,
): Promise<string[]> {
  const { data: matchPlayers, error: matchPlayersError } =
    await listMatchPlayers(matchId);
  if (!matchPlayersError && matchPlayers.length > 0) {
    return matchPlayers.map((row) => row.player_id);
  }

  const { data: roster } = await listRosterForTeam(teamId);
  return roster.map((player) => player.id);
}

export async function createMatchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const opponent_name = str(formData, "opponent_name");
  const date = str(formData, "date");
  const kickoff_time = str(formData, "kickoff_time") || null;
  const home_away = str(formData, "home_away") as MatchHomeAway;
  const status = (str(formData, "status") || "scheduled") as MatchStatus;
  const competition_id = str(formData, "competition_id") || null;
  const notes = str(formData, "notes") || null;
  const club_notes = str(formData, "club_notes") || null;
  const periodsRaw = str(formData, "periods");
  const periods: CompetitionPeriods = isCompetitionPeriods(periodsRaw)
    ? periodsRaw
    : DEFAULT_MATCH_PERIODS;

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_HOME_AWAYS.includes(home_away)) {
    return { error: "Invalid home/away value." };
  }
  if (!MATCH_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const [team, ctx] = await Promise.all([getActiveTeam(), getViewerContext()]);
  if (!team) return { error: "No team selected." };
  if (!ctx || !canEditMatchDay(ctx, team.id)) {
    return { error: "You do not have permission to add fixtures." };
  }

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
    status,
    player_of_the_match_id: null,
    players_player_of_the_match_id: null,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create match." };

  const periodNames = periodNamesForCompetitionPeriods(periods);
  if (periodNames.length > 0) {
    const starterIds = await defaultStarterPlayerIds(data.id, team.id);
    const { error: periodsError } = await createPeriodsWithStarters(
      data.id,
      periodNames,
      starterIds,
    );
    if (periodsError) return { error: periodsError };
  }

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

  if (!opponent_name || !date) {
    return { error: "Opponent and date are required." };
  }
  if (!MATCH_HOME_AWAYS.includes(home_away)) {
    return { error: "Invalid home/away value." };
  }
  if (!MATCH_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const [team, ctx, existing] = await Promise.all([
    getActiveTeam(),
    getViewerContext(),
    getMatch(id),
  ]);
  if (!team) return { error: "No team selected." };
  if (existing.error) return { error: existing.error };
  if (!existing.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, existing.data.team_id)) {
    return { error: "You do not have permission to edit this match." };
  }

  const venueResult = await parseVenueId(formData, team.club_id);
  if ("error" in venueResult) return { error: venueResult.error };

  const allowsEvents = matchAllowsEvents(status);
  const canEditPotm = canEditTeam(ctx, existing.data.team_id);

  const { error } = await updateMatch(id, {
    opponent_name,
    date,
    kickoff_time,
    home_away,
    venue_id: venueResult.venue_id,
    status,
    competition_id,
    notes,
    club_notes,
    ...(canEditPotm
      ? {
          player_of_the_match_id: allowsEvents ? player_of_the_match_id : null,
          players_player_of_the_match_id: allowsEvents
            ? players_player_of_the_match_id
            : null,
        }
      : {}),
  });

  if (error) return { error };

  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath(`/matches/${id}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  redirect(`/matches/${id}`);
}

export async function updateMatchPlayersOfTheMatchAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const player_of_the_match_id =
    str(formData, "player_of_the_match_id") || null;
  const players_player_of_the_match_id =
    str(formData, "players_player_of_the_match_id") || null;

  const [ctx, loaded] = await Promise.all([getViewerContext(), getMatch(id)]);
  const { data: match, error: loadError } = loaded;
  if (loadError) return { error: loadError };
  if (!match) return { error: "Match not found." };
  if (!ctx || !canEditTeam(ctx, match.team_id)) {
    return {
      error: "Only coaches and management can set player of the match.",
    };
  }

  if (!matchAllowsEvents(match.status)) {
    return {
      error:
        "Players of the match can only be set when the match is in progress or played.",
    };
  }

  const { error } = await updateMatch(id, {
    player_of_the_match_id,
    players_player_of_the_match_id,
  });
  if (error) return { error };

  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath(`/matches/${id}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: "Players of the match saved." };
}

export async function deleteMatchAction(id: string): Promise<ActionState> {
  const [ctx, loaded] = await Promise.all([getViewerContext(), getMatch(id)]);
  if (loaded.error) return { error: loaded.error };
  if (!loaded.data) return { error: "Match not found." };
  if (!ctx || !canEditMatchDay(ctx, loaded.data.team_id)) {
    return { error: "You do not have permission to delete this match." };
  }

  const { error } = await deleteMatch(id);
  if (error) return { error };

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/club");
  redirect("/matches");
}
