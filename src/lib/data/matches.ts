import { createClient } from "@/lib/supabase/server";
import {
  CARD_PERSON_SELECT,
  mapCardRow,
  type CardWithPerson,
} from "@/lib/data/cards";
import {
  GOAL_SELECT,
  mapGoalRow,
  type GoalWithPlayers,
} from "@/lib/data/goals";
import { setMatchSquad } from "@/lib/data/match-players";
import {
  mapPeriodRow,
  PERIOD_SELECT,
  type MatchPeriodWithStarters,
  type PeriodRow,
} from "@/lib/data/match-periods";
import { listRosterForTeam } from "@/lib/data/players";
import { getActiveTeam } from "@/lib/data/team";
import { archivedTeamWriteError } from "@/lib/team/season";
import type { MatchListFilter } from "@/lib/constants";
import { scoreFromGoals } from "@/lib/format";
import type {
  Competition,
  Match,
  MatchPlayer,
  TablesInsert,
  TablesUpdate,
  Venue,
} from "@/lib/supabase/database.types";

export type { Match };

export type MatchWithRelations = Match & {
  competition: Pick<
    Competition,
    "id" | "name" | "display_name" | "kind"
  > | null;
  venue: Pick<Venue, "id" | "name"> | null;
  /** Derived from goal rows (not stored on matches). */
  goals_for: number;
  /** Derived from goal rows (not stored on matches). */
  goals_against: number;
};

const MATCH_SELECT =
  "*, competition:competitions(id, name, display_name, kind), venue:venues(id, name), goals(is_opposition)";

/** Nested match-detail select: one round-trip for the match page (§5.4). */
const MATCH_DETAIL_SELECT = `*, competition:competitions(id, name, display_name, kind), venue:venues(id, name), goals(${GOAL_SELECT}), cards(${CARD_PERSON_SELECT}), match_players(*), match_periods(${PERIOD_SELECT})`;

export type MatchDetail = {
  match: MatchWithRelations;
  goals: GoalWithPlayers[];
  cards: CardWithPerson[];
  matchPlayers: MatchPlayer[];
  periods: MatchPeriodWithStarters[];
};

export async function listMatches(
  filter: MatchListFilter = "all",
): Promise<{ data: MatchWithRelations[]; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) {
    return { data: [], error: "No team selected." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("team_id", team.id);

  if (filter === "upcoming") {
    query = query.eq("status", "scheduled").order("date", { ascending: true });
  } else if (filter === "played") {
    query = query.eq("status", "played").order("date", { ascending: false });
  } else if (filter === "other") {
    query = query
      .in("status", ["postponed", "cancelled"])
      .order("date", { ascending: false });
  } else {
    query = query.order("date", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  return { data: (data ?? []).map(normalizeMatchRow), error: null };
}

export async function getMatch(
  id: string,
): Promise<{ data: MatchWithRelations | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: normalizeMatchRow(data), error: null };
}

/**
 * §5.4 — Match, goals, cards, squad rows, and periods in one nested select
 * instead of getMatch() plus five follow-up queries.
 */
export async function getMatchDetail(
  id: string,
): Promise<{ data: MatchDetail | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const row = data as RawMatchRow & {
    cards?: unknown;
    match_players?: unknown;
    match_periods?: unknown;
  };

  const goals = (Array.isArray(row.goals) ? row.goals : [])
    .map((goal) => mapGoalRow(goal as Parameters<typeof mapGoalRow>[0]))
    .sort((a, b) => {
      if (a.minute == null && b.minute == null) {
        return a.created_at.localeCompare(b.created_at);
      }
      if (a.minute == null) return 1;
      if (b.minute == null) return -1;
      if (a.minute !== b.minute) return a.minute - b.minute;
      return a.created_at.localeCompare(b.created_at);
    });

  const cards = (Array.isArray(row.cards) ? row.cards : [])
    .map((card) => mapCardRow(card as Parameters<typeof mapCardRow>[0]))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const matchPlayers = (
    Array.isArray(row.match_players) ? row.match_players : []
  ) as MatchPlayer[];
  matchPlayers.sort((a, b) => a.created_at.localeCompare(b.created_at));

  const periods = (Array.isArray(row.match_periods) ? row.match_periods : [])
    .map((period) => mapPeriodRow(period as PeriodRow))
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.created_at.localeCompare(b.created_at);
    });

  return {
    data: {
      match: normalizeMatchRow(row),
      goals,
      cards,
      matchPlayers,
      periods,
    },
    error: null,
  };
}

export async function createMatch(
  input: Omit<TablesInsert<"matches">, "team_id">,
): Promise<{ data: Match | null; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) {
    return { data: null, error: "No team selected." };
  }
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { data: null, error: archivedError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({ ...input, team_id: team.id })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Could not create match." };

  // Default match-day squad: every active player on the team roster.
  const { data: roster, error: rosterError } = await listRosterForTeam(team.id);
  if (rosterError) return { data: null, error: rosterError };

  if (roster.length > 0) {
    const { error: squadError } = await setMatchSquad(
      data.id,
      roster.map((player) => player.id),
    );
    if (squadError) return { data: null, error: squadError };
  }

  return { data, error: null };
}

export async function updateMatch(
  id: string,
  input: TablesUpdate<"matches">,
): Promise<{ data: Match | null; error: string | null }> {
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("matches")
    .select("team_id")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return { data: null, error: loadError.message };
  if (!existing) return { data: null, error: "Match not found." };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("archived_at")
    .eq("id", existing.team_id)
    .maybeSingle();
  if (teamError) return { data: null, error: teamError.message };
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { data: null, error: archivedError };
  const { data, error } = await supabase
    .from("matches")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) {
    return {
      data: null,
      error:
        "Could not update this match. You may not have permission to change it.",
    };
  }
  return { data, error: null };
}

export async function deleteMatch(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("matches")
    .select("team_id")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!existing) return { error: "Match not found." };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("archived_at")
    .eq("id", existing.team_id)
    .maybeSingle();
  if (teamError) return { error: teamError.message };
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { error: archivedError };
  const { error } = await supabase.from("matches").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function getNextFixture(): Promise<{
  data: MatchWithRelations | null;
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: null, error: "No team selected." };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // §6.5 — One query for all scheduled matches, ordered by date. Pick the
  // first on/after today, otherwise the earliest scheduled row (past fallback).
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("team_id", team.id)
    .eq("status", "scheduled")
    .order("date", { ascending: true });

  if (error) return { data: null, error: error.message };

  const rows = data ?? [];
  const chosen = rows.find((row) => row.date >= today) ?? rows[0] ?? null;
  if (!chosen) return { data: null, error: null };
  return { data: normalizeMatchRow(chosen), error: null };
}

export async function getLastResult(): Promise<{
  data: MatchWithRelations | null;
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: null, error: "No team selected." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("team_id", team.id)
    .eq("status", "played")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: normalizeMatchRow(data), error: null };
}

type RawMatchRow = Match & {
  competition: unknown;
  venue: unknown;
  goals?: Array<{ is_opposition: boolean }> | null;
};

function normalizeRelation<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export function normalizeMatchRow(row: RawMatchRow): MatchWithRelations {
  const { goalsFor, goalsAgainst } = scoreFromGoals(
    Array.isArray(row.goals) ? row.goals : [],
  );

  return {
    id: row.id,
    team_id: row.team_id,
    opponent_name: row.opponent_name,
    date: row.date,
    kickoff_time: row.kickoff_time,
    meetup_time: row.meetup_time,
    home_away: row.home_away,
    venue_id: row.venue_id,
    competition_id: row.competition_id,
    is_friendly: row.is_friendly,
    player_of_the_match_id: row.player_of_the_match_id,
    players_player_of_the_match_id: row.players_player_of_the_match_id,
    status: row.status,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    notes: row.notes,
    club_notes: row.club_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    competition: normalizeRelation(row.competition),
    venue: normalizeRelation(row.venue),
  };
}
