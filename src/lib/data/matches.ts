import { createClient } from "@/lib/supabase/server";
import { setMatchSquad } from "@/lib/data/match-players";
import { listRosterForTeam } from "@/lib/data/players";
import { getActiveTeam } from "@/lib/data/team";
import type { MatchListFilter } from "@/lib/constants";
import { scoreFromGoals } from "@/lib/format";
import type {
  Competition,
  Match,
  TablesInsert,
  TablesUpdate,
  Venue,
} from "@/lib/supabase/database.types";

export type { Match };

export type MatchWithRelations = Match & {
  competition: Pick<Competition, "id" | "name" | "kind"> | null;
  venue: Pick<Venue, "id" | "name"> | null;
  /** Derived from goal rows (not stored on matches). */
  goals_for: number;
  /** Derived from goal rows (not stored on matches). */
  goals_against: number;
};

const MATCH_SELECT =
  "*, competition:competitions(id, name, kind), venue:venues(id, name), goals(is_opposition)";

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

export async function createMatch(
  input: Omit<TablesInsert<"matches">, "team_id">,
): Promise<{ data: Match | null; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) {
    return { data: null, error: "No team selected." };
  }

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
  const { data, error } = await supabase
    .from("matches")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteMatch(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
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

  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("team_id", team.id)
    .eq("status", "scheduled")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: error.message };

  if (!data) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("team_id", team.id)
      .eq("status", "scheduled")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackError) return { data: null, error: fallbackError.message };
    if (!fallback) return { data: null, error: null };
    return { data: normalizeMatchRow(fallback), error: null };
  }

  return { data: normalizeMatchRow(data), error: null };
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

function normalizeMatchRow(row: RawMatchRow): MatchWithRelations {
  const { goalsFor, goalsAgainst } = scoreFromGoals(
    Array.isArray(row.goals) ? row.goals : [],
  );

  return {
    id: row.id,
    team_id: row.team_id,
    opponent_name: row.opponent_name,
    date: row.date,
    kickoff_time: row.kickoff_time,
    home_away: row.home_away,
    venue_id: row.venue_id,
    competition_id: row.competition_id,
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
