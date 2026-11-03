import { one } from "@/lib/supabase/relations";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { resultLetter, scoreFromGoals } from "@/lib/format";
import type { CompetitionKind } from "@/lib/supabase/database.types";
import { STATS_FORM_LIMIT } from "@/lib/constants";
import {
  LEAGUE_AND_CUP_COMPETITION_KINDS,
  isLeagueAndCupMatch,
} from "@/lib/stats/competition-filters";

// ---------------------------------------------------------------------------
// §5.1 + §6.4 — Composite stats RPC
// ---------------------------------------------------------------------------

/**
 * Raw shape returned by each element of the `goals_by_player` array in the
 * `get_team_stats` RPC response.
 */
type RpcGoalsEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  goals: number;
  matches_played: number;
  periods_played: number;
  goal_competitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

type RpcAssistsEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  assists: number;
  matches_played: number;
  periods_played?: number;
  competitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

/** Competition details for one counted event (goal, assist, appearance, ...). */
type RpcCompetitionEvent = {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly: boolean;
};

type RpcPotmEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  count: number;
  competitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

type RpcMatchesPlayedEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  count: number;
  periods_played?: number;
  competitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

type RpcResultEntry = {
  match_id: string;
  date: string;
  opponent_name: string;
  goals_for: number;
  goals_against: number;
  competition_id: string | null;
  competition_kind: CompetitionKind | null;
  competition_name: string | null;
  is_friendly: boolean;
};

type RpcPlayerOfTheMonthEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  count: number;
};

type TeamStatsRpcResult = {
  shirt_numbers: Record<string, number | null>;
  goals_by_player: RpcGoalsEntry[];
  assists_by_player: RpcAssistsEntry[];
  potm_by_player: RpcPotmEntry[];
  player_of_the_month_by_player: RpcPlayerOfTheMonthEntry[];
  matches_played_by_player: RpcMatchesPlayedEntry[];
  results_over_time: RpcResultEntry[];
};

function mapCompetitionEvents(
  events: RpcCompetitionEvent[] | null | undefined,
): NonNullable<PlayerCountPoint["events"]> {
  return (events ?? []).map((event) => ({
    competitionId: event.competitionId,
    competitionKind: event.competitionKind,
    isFriendly: event.isFriendly,
  }));
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Check the top-level shape of the `get_team_stats` result. A missing series
 * becomes an empty list; a result that is not an object at all is rejected so
 * schema drift shows up as an error instead of a crash further down.
 */
export function parseTeamStatsRpc(data: unknown): TeamStatsRpcResult | null {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const raw = data as Record<string, unknown>;
  const shirtNumbers = raw.shirt_numbers;
  return {
    shirt_numbers:
      shirtNumbers !== null &&
      typeof shirtNumbers === "object" &&
      !Array.isArray(shirtNumbers)
        ? (shirtNumbers as Record<string, number | null>)
        : {},
    goals_by_player: asArray(raw.goals_by_player),
    assists_by_player: asArray(raw.assists_by_player),
    potm_by_player: asArray(raw.potm_by_player),
    player_of_the_month_by_player: asArray(raw.player_of_the_month_by_player),
    matches_played_by_player: asArray(raw.matches_played_by_player),
    results_over_time: asArray(raw.results_over_time),
  };
}

/**
 * §5.1 + §6.4 — Calls the `get_team_stats` Postgres RPC and maps the result
 * into the existing TypeScript stat types.  One DB call replaces ~11 separate
 * queries.
 *
 * Cached per request with `React.cache()` so multiple callers (e.g. different
 * sections of a page) share the same result without re-fetching.
 */
export const getAllTeamStats = cache(
  async (
    teamId: string,
  ): Promise<{
    goalsByPlayer: GoalsByPlayerPoint[];
    assistsByPlayer: PlayerCountPoint[];
    potmByPlayer: PlayerCountPoint[];
    playerOfTheMonthByPlayer: PlayerCountPoint[];
    matchesPlayed: PlayerCountPoint[];
    resultsOverTime: ResultOverTimePoint[];
    form: Array<"W" | "D" | "L">;
    error: string | null;
  }> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_team_stats", {
      p_team_id: teamId,
    });

    if (error) {
      return {
        goalsByPlayer: [],
        assistsByPlayer: [],
        potmByPlayer: [],
        playerOfTheMonthByPlayer: [],
        matchesPlayed: [],
        resultsOverTime: [],
        form: [],
        error: error.message,
      };
    }

    const raw = parseTeamStatsRpc(data);
    if (!raw) {
      return {
        goalsByPlayer: [],
        assistsByPlayer: [],
        potmByPlayer: [],
        playerOfTheMonthByPlayer: [],
        matchesPlayed: [],
        resultsOverTime: [],
        form: [],
        error: "Unexpected response from get_team_stats.",
      };
    }

    // ------------------------------------------------------------------
    // Map goals_by_player
    // ------------------------------------------------------------------
    const goalsByPlayer: GoalsByPlayerPoint[] = raw.goals_by_player.map(
      (entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        goals: Number(entry.goals),
        position: entry.position ?? null,
        matchesPlayed: Number(entry.matches_played),
        periodsPlayed: Number(entry.periods_played),
        goalCompetitions: mapCompetitionEvents(entry.goal_competitions),
      }),
    );

    // ------------------------------------------------------------------
    // Map assists_by_player
    // ------------------------------------------------------------------
    const assistsByPlayer: PlayerCountPoint[] = raw.assists_by_player.map(
      (entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.assists),
        position: entry.position ?? null,
        matchesPlayed: Number(entry.matches_played),
        periodsPlayed: Number(entry.periods_played ?? 0),
        events: mapCompetitionEvents(entry.competitions),
      }),
    );

    // ------------------------------------------------------------------
    // Map potm_by_player
    // ------------------------------------------------------------------
    const potmByPlayer: PlayerCountPoint[] = raw.potm_by_player.map(
      (entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.count),
        events: mapCompetitionEvents(entry.competitions),
      }),
    );

    // Monthly awards are team-scoped, so they have no competition events.
    const playerOfTheMonthByPlayer: PlayerCountPoint[] =
      raw.player_of_the_month_by_player.map((entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.count),
      }));

    // ------------------------------------------------------------------
    // Map matches_played_by_player
    // ------------------------------------------------------------------
    const matchesPlayed: PlayerCountPoint[] = raw.matches_played_by_player.map(
      (entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.count),
        position: entry.position ?? null,
        periodsPlayed: Number(entry.periods_played ?? 0),
        events: mapCompetitionEvents(entry.competitions),
      }),
    );

    // ------------------------------------------------------------------
    // Map results_over_time
    // ------------------------------------------------------------------
    const resultsOverTime: ResultOverTimePoint[] = [];
    const form: Array<"W" | "D" | "L"> = [];

    for (const entry of raw.results_over_time) {
      const goalsFor = Number(entry.goals_for);
      const goalsAgainst = Number(entry.goals_against);
      const letter = resultLetter(goalsFor, goalsAgainst);
      if (!letter) continue;
      form.push(letter);
      resultsOverTime.push({
        matchId: entry.match_id,
        date: entry.date,
        label: entry.opponent_name,
        goalsFor,
        goalsAgainst,
        result: letter,
        competitionId: entry.competition_id,
        competitionKind: entry.competition_kind,
        competitionName: entry.is_friendly
          ? "Friendly"
          : (entry.competition_name ?? null),
        isFriendly: entry.is_friendly,
      });
    }

    // Keep only the most recent N results for the form strip
    const recentForm = form.slice(-STATS_FORM_LIMIT);

    return {
      goalsByPlayer,
      assistsByPlayer,
      potmByPlayer,
      playerOfTheMonthByPlayer,
      matchesPlayed,
      resultsOverTime,
      form: recentForm,
      error: null,
    };
  },
);

type RpcPeriodStartsEntry = {
  player_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  count: number;
  competitions: RpcCompetitionEvent[];
};

/**
 * Period starts per player (club managers only; the RPC returns an empty list
 * for anyone else). Each player's `events` has one entry per period they
 * started, so the usual competition filters can count the matching ones.
 */
export const getPeriodStartsByPlayer = cache(
  async (
    teamId: string,
  ): Promise<{ data: PlayerCountPoint[]; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_period_starts_by_player", {
      p_team_id: teamId,
    });
    if (error) return { data: [], error: error.message };

    return {
      data: asArray<RpcPeriodStartsEntry>(data).map((entry) => ({
        playerId: entry.player_id,
        personId: entry.person_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.count),
        position: entry.position ?? null,
        events: mapCompetitionEvents(entry.competitions),
      })),
      error: null,
    };
  },
);

export type GoalsByPlayerPoint = {
  playerId: string;
  /** Links the player to /people/<personId>. */
  personId: string;
  name: string;
  goals: number;
  position: string | null;
  matchesPlayed: number;
  periodsPlayed: number;
  /** One entry per goal for competition filtering. */
  goalCompetitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

export type PlayerCountPoint = {
  playerId: string;
  /** Links the player to /people/<personId>. */
  personId: string;
  name: string;
  count: number;
  position?: string | null;
  matchesPlayed?: number;
  periodsPlayed?: number;
  events?: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

export type ResultOverTimePoint = {
  matchId: string;
  date: string;
  label: string;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  competitionName: string | null;
  isFriendly: boolean;
};

function competitionFromMatch(matchRaw: unknown): {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly: boolean;
} {
  const match = one(matchRaw);
  if (!match || typeof match !== "object") {
    return { competitionId: null, competitionKind: null, isFriendly: false };
  }
  const row = match as {
    competition_id?: string | null;
    is_friendly?: boolean;
    competition?:
      | { id?: string; kind?: CompetitionKind | null }
      | Array<{ id?: string; kind?: CompetitionKind | null }>
      | null;
  };
  const competitionRaw = one(row.competition);
  return {
    competitionId: competitionRaw?.id ?? row.competition_id ?? null,
    competitionKind: (competitionRaw?.kind as CompetitionKind | null) ?? null,
    isFriendly: Boolean(row.is_friendly),
  };
}

function isMatchOnOrBefore(
  row: { id: string; date: string; created_at: string },
  through: { id: string; date: string; created_at: string },
): boolean {
  if (row.id === through.id) return true;
  if (row.date < through.date) return true;
  if (row.date > through.date) return false;
  return row.created_at <= through.created_at;
}

/**
 * Form strip for a match card: played league and cup matches up to and
 * including `through`, oldest → newest. This match is last when it is a
 * league or cup game.
 */
export async function getFormThroughMatch(
  teamId: string,
  through: { id: string; date: string; created_at: string },
  thisResult: "W" | "D" | "L",
  limit = STATS_FORM_LIMIT,
): Promise<{ form: Array<"W" | "D" | "L">; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, date, created_at, is_friendly, competition_id, competition:competitions(id, kind), goals(is_opposition)",
    )
    .eq("team_id", teamId)
    .eq("status", "played")
    .eq("is_friendly", false)
    .in("competition.kind", [...LEAGUE_AND_CUP_COMPETITION_KINDS])
    .lte("date", through.date)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { form: [thisResult], error: error.message };

  const rows = (data ?? []).filter((row) =>
    isLeagueAndCupMatch(competitionFromMatch(row)),
  );
  const includesThis = rows.some((row) => row.id === through.id);
  const prior: Array<"W" | "D" | "L"> = [];
  for (const row of rows) {
    if (!isMatchOnOrBefore(row, through) || row.id === through.id) continue;
    const { goalsFor, goalsAgainst } = scoreFromGoals(
      Array.isArray(row.goals) ? row.goals : [],
    );
    const letter = resultLetter(goalsFor, goalsAgainst);
    if (letter) prior.push(letter);
  }

  const form = includesThis ? [...prior, thisResult] : prior;
  return { form: form.slice(-limit), error: null };
}

export type PlayerRecord = { wins: number; draws: number; losses: number };

/**
 * Wins / draws / losses in the played, non-friendly matches a player was in
 * the match-day squad for. Results come from the goals (`scoreFromGoals`), the
 * same as the match page.
 */
export async function getPlayerCompetitiveRecord(
  teamId: string,
  playerId: string,
): Promise<{ data: PlayerRecord; error: string | null }> {
  const record: PlayerRecord = { wins: 0, draws: 0, losses: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_players")
    .select(
      "match:matches!inner(team_id, status, is_friendly, goals(is_opposition))",
    )
    .eq("player_id", playerId)
    .eq("match.team_id", teamId)
    .eq("match.status", "played")
    .eq("match.is_friendly", false);

  if (error) return { data: record, error: error.message };

  for (const row of data ?? []) {
    const match = one(row.match);
    if (!match) continue;
    const { goalsFor, goalsAgainst } = scoreFromGoals(
      Array.isArray(match.goals) ? match.goals : [],
    );
    const letter = resultLetter(goalsFor, goalsAgainst);
    if (letter === "W") record.wins += 1;
    else if (letter === "D") record.draws += 1;
    else if (letter === "L") record.losses += 1;
  }
  return { data: record, error: null };
}
