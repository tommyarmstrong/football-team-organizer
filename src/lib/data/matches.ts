import { createClient } from "@/lib/supabase/server";
import { getCurrentTeam } from "@/lib/data/team";
import type { MatchListFilter } from "@/lib/constants";
import type {
  Competition,
  Match,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Match };

export type MatchWithCompetition = Match & {
  competition: Pick<Competition, "id" | "name" | "kind"> | null;
};

export async function listMatches(
  filter: MatchListFilter = "all",
): Promise<{ data: MatchWithCompetition[]; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("matches")
    .select("*, competition:competitions(id, name, kind)")
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

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = (data ?? []).map((row) => {
    const competition = Array.isArray(row.competition)
      ? (row.competition[0] ?? null)
      : row.competition;
    return {
      id: row.id,
      team_id: row.team_id,
      opponent_name: row.opponent_name,
      date: row.date,
      kickoff_time: row.kickoff_time,
      venue: row.venue,
      competition_id: row.competition_id,
      status: row.status,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      competition,
    };
  });

  return { data: rows, error: null };
}

export async function getMatch(
  id: string,
): Promise<{ data: MatchWithCompetition | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*, competition:competitions(id, name, kind)")
    .eq("id", id)
    .eq("team_id", team.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const competition = Array.isArray(data.competition)
    ? (data.competition[0] ?? null)
    : data.competition;
  return {
    data: {
      id: data.id,
      team_id: data.team_id,
      opponent_name: data.opponent_name,
      date: data.date,
      kickoff_time: data.kickoff_time,
      venue: data.venue,
      competition_id: data.competition_id,
      status: data.status,
      goals_for: data.goals_for,
      goals_against: data.goals_against,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      competition,
    },
    error: null,
  };
}

export async function createMatch(
  input: Omit<TablesInsert<"matches">, "team_id">,
): Promise<{ data: Match | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({ ...input, team_id: team.id })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateMatch(
  id: string,
  input: TablesUpdate<"matches">,
): Promise<{ data: Match | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .update(input)
    .eq("id", id)
    .eq("team_id", team.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getNextFixture(): Promise<{
  data: MatchWithCompetition | null;
  error: string | null;
}> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("matches")
    .select("*, competition:competitions(id, name, kind)")
    .eq("team_id", team.id)
    .eq("status", "scheduled")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    // Fall back to any upcoming scheduled match (past date still scheduled)
    const { data: fallback, error: fallbackError } = await supabase
      .from("matches")
      .select("*, competition:competitions(id, name, kind)")
      .eq("team_id", team.id)
      .eq("status", "scheduled")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      return { data: null, error: fallbackError.message };
    }
    if (!fallback) return { data: null, error: null };
    return { data: normalizeMatchRow(fallback), error: null };
  }

  return { data: normalizeMatchRow(data), error: null };
}

export async function getLastResult(): Promise<{
  data: MatchWithCompetition | null;
  error: string | null;
}> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*, competition:competitions(id, name, kind)")
    .eq("team_id", team.id)
    .eq("status", "played")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) return { data: null, error: null };
  return { data: normalizeMatchRow(data), error: null };
}

function normalizeMatchRow(row: {
  id: string;
  team_id: string;
  opponent_name: string;
  date: string;
  kickoff_time: string | null;
  venue: Match["venue"];
  competition_id: string | null;
  status: Match["status"];
  goals_for: number | null;
  goals_against: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  competition: unknown;
}): MatchWithCompetition {
  const competition = Array.isArray(row.competition)
    ? (row.competition[0] ?? null)
    : (row.competition as MatchWithCompetition["competition"]);
  return {
    id: row.id,
    team_id: row.team_id,
    opponent_name: row.opponent_name,
    date: row.date,
    kickoff_time: row.kickoff_time,
    venue: row.venue,
    competition_id: row.competition_id,
    status: row.status,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    competition,
  };
}
