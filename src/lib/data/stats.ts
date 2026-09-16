import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getActiveTeam } from "@/lib/data/team";
import { resultLetter, scoreFromGoals } from "@/lib/format";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
} from "@/lib/people/named-player";
import type { CompetitionKind } from "@/lib/supabase/database.types";
import { STATS_FORM_LIMIT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// §5.1 + §6.4 — Composite stats RPC
// ---------------------------------------------------------------------------

/**
 * Raw shape returned by each element of the `goals_by_player` array in the
 * `get_team_stats` RPC response.
 */
type RpcGoalsEntry = {
  player_id: string;
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
  first_name: string;
  last_name: string;
  assists: number;
  matches_played: number;
  competitions: Array<{
    competitionId: string | null;
    competitionKind: CompetitionKind | null;
    isFriendly: boolean;
  }>;
};

type RpcPotmEntry = {
  player_id: string;
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
  first_name: string;
  last_name: string;
  count: number;
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

type TeamStatsRpcResult = {
  shirt_numbers: Record<string, number | null>;
  goals_by_player: RpcGoalsEntry[];
  assists_by_player: RpcAssistsEntry[];
  potm_by_player: RpcPotmEntry[];
  matches_played_by_player: RpcMatchesPlayedEntry[];
  results_over_time: RpcResultEntry[];
};

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
        matchesPlayed: [],
        resultsOverTime: [],
        form: [],
        error: error.message,
      };
    }

    const raw = data as TeamStatsRpcResult;

    // ------------------------------------------------------------------
    // Map shirt numbers from the flat object to a Map<playerId, shirt>
    // ------------------------------------------------------------------
    const shirtByPlayer = new Map<string, number | null>(
      Object.entries(raw.shirt_numbers ?? {}),
    );

    // ------------------------------------------------------------------
    // Map goals_by_player
    // ------------------------------------------------------------------
    const goalsByPlayer: GoalsByPlayerPoint[] = (raw.goals_by_player ?? []).map(
      (entry) => ({
        playerId: entry.player_id,
        name: `${entry.first_name} ${entry.last_name}`,
        goals: Number(entry.goals),
        position: entry.position ?? null,
        matchesPlayed: Number(entry.matches_played),
        periodsPlayed: Number(entry.periods_played),
        goalCompetitions: (entry.goal_competitions ?? []).map((gc) => ({
          competitionId: gc.competitionId,
          competitionKind: gc.competitionKind,
          isFriendly: gc.isFriendly,
        })),
      }),
    );

    // Inject shirt number from the team roster lookup
    for (const row of goalsByPlayer) {
      // shirt_number is not in GoalsByPlayerPoint; it lives on the player object
      // in TopScorer / PlayerStatLeader. GoalsByPlayerPoint uses positional data only.
      void row; // nothing to patch — shirt is unused in this type
    }

    // ------------------------------------------------------------------
    // Map assists_by_player
    // ------------------------------------------------------------------
    const assistsByPlayer: PlayerCountPoint[] = (
      raw.assists_by_player ?? []
    ).map((entry) => ({
      playerId: entry.player_id,
      name: `${entry.first_name} ${entry.last_name}`,
      count: Number(entry.assists),
      matchesPlayed: Number(entry.matches_played),
      events: (entry.competitions ?? []).map((c) => ({
        competitionId: c.competitionId,
        competitionKind: c.competitionKind,
        isFriendly: c.isFriendly,
      })),
    }));

    // ------------------------------------------------------------------
    // Map potm_by_player
    // ------------------------------------------------------------------
    const potmByPlayer: PlayerCountPoint[] = (raw.potm_by_player ?? []).map(
      (entry) => ({
        playerId: entry.player_id,
        name: `${entry.first_name} ${entry.last_name}`,
        count: Number(entry.count),
        events: (entry.competitions ?? []).map((c) => ({
          competitionId: c.competitionId,
          competitionKind: c.competitionKind,
          isFriendly: c.isFriendly,
        })),
      }),
    );

    // ------------------------------------------------------------------
    // Map matches_played_by_player
    // ------------------------------------------------------------------
    const matchesPlayed: PlayerCountPoint[] = (
      raw.matches_played_by_player ?? []
    ).map((entry) => ({
      playerId: entry.player_id,
      name: `${entry.first_name} ${entry.last_name}`,
      count: Number(entry.count),
      events: (entry.competitions ?? []).map((c) => ({
        competitionId: c.competitionId,
        competitionKind: c.competitionKind,
        isFriendly: c.isFriendly,
      })),
    }));

    // ------------------------------------------------------------------
    // Map results_over_time
    // ------------------------------------------------------------------
    const resultsOverTime: ResultOverTimePoint[] = [];
    const form: Array<"W" | "D" | "L"> = [];

    for (const entry of raw.results_over_time ?? []) {
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

    // shirtByPlayer is resolved at the RPC level for the team; it is only
    // needed by getTopScorers / getTopAssists which keep their own queries for
    // the dashboard sidebar (those functions are not called on the stats page).
    void shirtByPlayer;

    return {
      goalsByPlayer,
      assistsByPlayer,
      potmByPlayer,
      matchesPlayed,
      resultsOverTime,
      form: recentForm,
      error: null,
    };
  },
);

export type TopScorer = {
  player: {
    id: string;
    person_id: string;
    first_name: string;
    last_name: string;
    shirt_number: number | null;
  };
  goals: number;
};

export type PlayerStatLeader = {
  player: {
    id: string;
    person_id: string;
    first_name: string;
    last_name: string;
    shirt_number: number | null;
  };
  count: number;
};

export type GoalsByPlayerPoint = {
  playerId: string;
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
  name: string;
  count: number;
  matchesPlayed?: number;
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

const getShirtByPlayer = cache(
  async (teamId: string): Promise<Map<string, number | null>> => {
    const supabase = await createClient();
    const { data: roster } = await supabase
      .from("team_players")
      .select("player_id, shirt_number")
      .eq("team_id", teamId);

    return new Map<string, number | null>(
      (roster ?? []).map((r) => [r.player_id, r.shirt_number]),
    );
  },
);

function rankPlayerCounts(
  counts: Map<string, PlayerStatLeader>,
  limit: number,
): PlayerStatLeader[] {
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

function bumpPlayerCount(
  counts: Map<string, PlayerStatLeader>,
  player: {
    id: string;
    person_id: string;
    first_name: string;
    last_name: string;
  },
  shirtByPlayer: Map<string, number | null>,
) {
  const existing = counts.get(player.id);
  if (existing) {
    existing.count += 1;
    return;
  }
  counts.set(player.id, {
    player: {
      id: player.id,
      person_id: player.person_id,
      first_name: player.first_name,
      last_name: player.last_name,
      shirt_number: shirtByPlayer.get(player.id) ?? null,
    },
    count: 1,
  });
}

function competitionFromMatch(matchRaw: unknown): {
  competitionId: string | null;
  competitionKind: CompetitionKind | null;
  isFriendly: boolean;
} {
  const match = Array.isArray(matchRaw) ? matchRaw[0] : matchRaw;
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
  const competitionRaw = Array.isArray(row.competition)
    ? row.competition[0]
    : row.competition;
  return {
    competitionId: competitionRaw?.id ?? row.competition_id ?? null,
    competitionKind: (competitionRaw?.kind as CompetitionKind | null) ?? null,
    isFriendly: Boolean(row.is_friendly),
  };
}

export async function getTopScorers(
  limit = 5,
): Promise<{ data: TopScorer[]; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const [{ data, error }, shirtByPlayer] = await Promise.all([
    supabase
      .from("goals")
      .select(
        `player_id, player:players!goals_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id, status)`,
      )
      .eq("match.team_id", team.id)
      .eq("match.status", "played")
      .eq("is_opposition", false),
    getShirtByPlayer(team.id),
  ]);

  if (error) return { data: [], error: error.message };

  const counts = new Map<string, TopScorer>();
  for (const row of data ?? []) {
    const playerRaw = Array.isArray(row.player) ? row.player[0] : row.player;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    const existing = counts.get(player.id);
    if (existing) {
      existing.goals += 1;
    } else {
      counts.set(player.id, {
        player: {
          id: player.id,
          person_id: player.person_id,
          first_name: player.first_name,
          last_name: player.last_name,
          shirt_number: shirtByPlayer.get(player.id) ?? null,
        },
        goals: 1,
      });
    }
  }

  const ranked = [...counts.values()]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);

  return { data: ranked, error: null };
}

export async function getTopAssists(
  limit = 5,
): Promise<{ data: PlayerStatLeader[]; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const [{ data, error }, shirtByPlayer] = await Promise.all([
    supabase
      .from("goals")
      .select(
        `assist_player_id, assist:players!goals_assist_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id, status)`,
      )
      .eq("match.team_id", team.id)
      .eq("match.status", "played")
      .eq("is_opposition", false)
      .not("assist_player_id", "is", null),
    getShirtByPlayer(team.id),
  ]);

  if (error) return { data: [], error: error.message };

  const counts = new Map<string, PlayerStatLeader>();
  for (const row of data ?? []) {
    const playerRaw = Array.isArray(row.assist) ? row.assist[0] : row.assist;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    bumpPlayerCount(counts, player, shirtByPlayer);
  }

  return { data: rankPlayerCounts(counts, limit), error: null };
}

export async function getTopPlayersOfTheMatch(
  limit = 5,
): Promise<{ data: PlayerStatLeader[]; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const [{ data, error }, shirtByPlayer] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `player_of_the_match_id, players_player_of_the_match_id,
         coach_potm:players!matches_player_of_the_match_id_fkey(${PLAYER_NAME_EMBED}),
         players_potm:players!matches_players_player_of_the_match_id_fkey(${PLAYER_NAME_EMBED})`,
      )
      .eq("team_id", team.id)
      .eq("status", "played"),
    getShirtByPlayer(team.id),
  ]);

  if (error) return { data: [], error: error.message };

  const counts = new Map<string, PlayerStatLeader>();
  for (const row of data ?? []) {
    for (const key of ["coach_potm", "players_potm"] as const) {
      const playerRaw = Array.isArray(row[key]) ? row[key][0] : row[key];
      const player = mapPlayerNameEmbed(
        playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
      );
      if (!player) continue;
      bumpPlayerCount(counts, player, shirtByPlayer);
    }
  }

  return { data: rankPlayerCounts(counts, limit), error: null };
}

export async function getGoalsByPlayerStats(): Promise<{
  data: GoalsByPlayerPoint[];
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const { data: goalRows, error: goalsError } = await supabase
    .from("goals")
    .select(
      `player_id, player:players!goals_player_id_fkey(${PLAYER_NAME_EMBED}, position), match:matches!inner(team_id, status, competition_id, is_friendly, competition:competitions(id, kind))`,
    )
    .eq("match.team_id", team.id)
    .eq("match.status", "played")
    .eq("is_opposition", false)
    .not("player_id", "is", null);

  if (goalsError) return { data: [], error: goalsError.message };

  const byPlayer = new Map<string, GoalsByPlayerPoint>();
  for (const row of goalRows ?? []) {
    const playerRaw = Array.isArray(row.player) ? row.player[0] : row.player;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    const position =
      playerRaw && !Array.isArray(playerRaw) && "position" in playerRaw
        ? ((playerRaw.position as string | null | undefined) ?? null)
        : null;
    const matchRaw = Array.isArray(row.match) ? row.match[0] : row.match;
    const competitionRaw =
      matchRaw && typeof matchRaw === "object" && "competition" in matchRaw
        ? Array.isArray(matchRaw.competition)
          ? matchRaw.competition[0]
          : matchRaw.competition
        : null;
    const competitionId =
      (competitionRaw &&
      typeof competitionRaw === "object" &&
      "id" in competitionRaw
        ? (competitionRaw.id as string)
        : null) ??
      (matchRaw && typeof matchRaw === "object" && "competition_id" in matchRaw
        ? ((matchRaw.competition_id as string | null) ?? null)
        : null);
    const competitionKind =
      competitionRaw &&
      typeof competitionRaw === "object" &&
      "kind" in competitionRaw
        ? ((competitionRaw.kind as CompetitionKind | null) ?? null)
        : null;
    const isFriendly =
      matchRaw && typeof matchRaw === "object" && "is_friendly" in matchRaw
        ? Boolean(matchRaw.is_friendly)
        : false;
    const existing = byPlayer.get(player.id);
    if (existing) {
      existing.goals += 1;
      existing.goalCompetitions.push({
        competitionId,
        competitionKind,
        isFriendly,
      });
      continue;
    }
    byPlayer.set(player.id, {
      playerId: player.id,
      name: `${player.first_name} ${player.last_name}`,
      goals: 1,
      position,
      matchesPlayed: 0,
      periodsPlayed: 0,
      goalCompetitions: [{ competitionId, competitionKind, isFriendly }],
    });
  }

  if (byPlayer.size === 0) return { data: [], error: null };

  const playerIds = [...byPlayer.keys()];

  const { data: playedMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id")
    .eq("team_id", team.id)
    .eq("status", "played");

  if (matchesError) return { data: [], error: matchesError.message };

  const matchIds = (playedMatches ?? []).map((match) => match.id);
  if (matchIds.length === 0) {
    return {
      data: [...byPlayer.values()].sort((a, b) => b.goals - a.goals),
      error: null,
    };
  }

  const [{ data: appearanceRows, error: appearancesError }, periodsResult] =
    await Promise.all([
      supabase
        .from("match_players")
        .select("player_id")
        .in("match_id", matchIds)
        .in("player_id", playerIds),
      supabase.from("match_periods").select("id").in("match_id", matchIds),
    ]);

  if (appearancesError) return { data: [], error: appearancesError.message };
  if (periodsResult.error) {
    return { data: [], error: periodsResult.error.message };
  }

  for (const row of appearanceRows ?? []) {
    const entry = byPlayer.get(row.player_id);
    if (entry) entry.matchesPlayed += 1;
  }

  const periodIds = (periodsResult.data ?? []).map((period) => period.id);
  if (periodIds.length > 0) {
    const { data: starterRows, error: startersError } = await supabase
      .from("match_period_starters")
      .select("player_id")
      .in("period_id", periodIds)
      .in("player_id", playerIds);

    if (startersError) return { data: [], error: startersError.message };

    for (const row of starterRows ?? []) {
      const entry = byPlayer.get(row.player_id);
      if (entry) entry.periodsPlayed += 1;
    }
  }

  return {
    data: [...byPlayer.values()].sort((a, b) => b.goals - a.goals),
    error: null,
  };
}

export async function getAssistsByPlayerStats(): Promise<{
  data: PlayerCountPoint[];
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select(
      `assist_player_id, assist:players!goals_assist_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id, status, competition_id, is_friendly, competition:competitions(id, kind))`,
    )
    .eq("match.team_id", team.id)
    .eq("match.status", "played")
    .eq("is_opposition", false)
    .not("assist_player_id", "is", null);

  if (error) return { data: [], error: error.message };

  const byPlayer = new Map<string, PlayerCountPoint>();
  for (const row of data ?? []) {
    const playerRaw = Array.isArray(row.assist) ? row.assist[0] : row.assist;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    const event = competitionFromMatch(row.match);
    const existing = byPlayer.get(player.id);
    if (existing) {
      existing.count += 1;
      existing.events = [...(existing.events ?? []), event];
      continue;
    }
    byPlayer.set(player.id, {
      playerId: player.id,
      name: `${player.first_name} ${player.last_name}`,
      count: 1,
      events: [event],
    });
  }

  if (byPlayer.size === 0) return { data: [], error: null };

  const playerIds = [...byPlayer.keys()];
  const { data: playedMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id")
    .eq("team_id", team.id)
    .eq("status", "played");

  if (matchesError) return { data: [], error: matchesError.message };

  const matchIds = (playedMatches ?? []).map((match) => match.id);
  if (matchIds.length > 0) {
    const { data: appearanceRows, error: appearancesError } = await supabase
      .from("match_players")
      .select("player_id")
      .in("match_id", matchIds)
      .in("player_id", playerIds);

    if (appearancesError) return { data: [], error: appearancesError.message };

    for (const row of appearanceRows ?? []) {
      const entry = byPlayer.get(row.player_id);
      if (entry) {
        entry.matchesPlayed = (entry.matchesPlayed ?? 0) + 1;
      }
    }
  }

  return {
    data: [...byPlayer.values()].sort((a, b) => b.count - a.count),
    error: null,
  };
}

export async function getPlayerOfTheMatchByPlayerStats(): Promise<{
  data: PlayerCountPoint[];
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `player_of_the_match_id, competition_id, is_friendly, competition:competitions(id, kind),
       coach_potm:players!matches_player_of_the_match_id_fkey(${PLAYER_NAME_EMBED})`,
    )
    .eq("team_id", team.id)
    .eq("status", "played")
    .not("player_of_the_match_id", "is", null);

  if (error) return { data: [], error: error.message };

  const byPlayer = new Map<string, PlayerCountPoint>();
  for (const row of data ?? []) {
    const playerRaw = Array.isArray(row.coach_potm)
      ? row.coach_potm[0]
      : row.coach_potm;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    const event = competitionFromMatch(row);
    const existing = byPlayer.get(player.id);
    if (existing) {
      existing.count += 1;
      existing.events = [...(existing.events ?? []), event];
      continue;
    }
    byPlayer.set(player.id, {
      playerId: player.id,
      name: `${player.first_name} ${player.last_name}`,
      count: 1,
      events: [event],
    });
  }

  return {
    data: [...byPlayer.values()].sort((a, b) => b.count - a.count),
    error: null,
  };
}

export async function getMatchesPlayedByPlayerStats(): Promise<{
  data: PlayerCountPoint[];
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_players")
    .select(
      `player_id, player:players!match_players_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id, competition_id, is_friendly, competition:competitions(id, kind))`,
    )
    .eq("match.team_id", team.id);

  if (error) return { data: [], error: error.message };

  const counts = new Map<string, PlayerCountPoint>();
  for (const row of data ?? []) {
    const playerRaw = Array.isArray(row.player) ? row.player[0] : row.player;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    const event = competitionFromMatch(row.match);
    const existing = counts.get(player.id);
    if (existing) {
      existing.count += 1;
      existing.events = [...(existing.events ?? []), event];
    } else {
      counts.set(player.id, {
        playerId: player.id,
        name: `${player.first_name} ${player.last_name}`,
        count: 1,
        events: [event],
      });
    }
  }

  return {
    data: [...counts.values()].sort((a, b) => b.count - a.count),
    error: null,
  };
}

export async function getResultsOverTime(): Promise<{
  data: ResultOverTimePoint[];
  error: string | null;
  form: Array<"W" | "D" | "L">;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected.", form: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, date, opponent_name, status, competition_id, is_friendly, competition:competitions(id, name, display_name, kind), goals(is_opposition)",
    )
    .eq("team_id", team.id)
    .eq("status", "played")
    .order("date", { ascending: true });

  if (error) return { data: [], error: error.message, form: [] };

  const points: ResultOverTimePoint[] = [];
  const form: Array<"W" | "D" | "L"> = [];

  for (const match of data ?? []) {
    const { goalsFor, goalsAgainst } = scoreFromGoals(
      Array.isArray(match.goals) ? match.goals : [],
    );
    const letter = resultLetter(goalsFor, goalsAgainst);
    if (!letter) continue;
    form.push(letter);
    const competitionRaw = Array.isArray(match.competition)
      ? match.competition[0]
      : match.competition;
    points.push({
      matchId: match.id,
      date: match.date,
      label: match.opponent_name,
      goalsFor,
      goalsAgainst,
      result: letter,
      competitionId: competitionRaw?.id ?? match.competition_id ?? null,
      competitionKind: (competitionRaw?.kind as CompetitionKind | null) ?? null,
      competitionName: match.is_friendly
        ? "Friendly"
        : (competitionRaw?.name ?? null),
      isFriendly: Boolean(match.is_friendly),
    });
  }

  const recentForm = form.slice(-STATS_FORM_LIMIT);

  return { data: points, error: null, form: recentForm };
}

/** Last N played-match results for the dashboard form strip (oldest → newest). */
export async function getRecentForm(
  limit = STATS_FORM_LIMIT,
): Promise<{ form: Array<"W" | "D" | "L">; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { form: [], error: "No team selected." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, date, goals(is_opposition)")
    .eq("team_id", team.id)
    .eq("status", "played")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) return { form: [], error: error.message };

  const form: Array<"W" | "D" | "L"> = [];
  for (const match of [...(data ?? [])].reverse()) {
    const { goalsFor, goalsAgainst } = scoreFromGoals(
      Array.isArray(match.goals) ? match.goals : [],
    );
    const letter = resultLetter(goalsFor, goalsAgainst);
    if (letter) form.push(letter);
  }

  return { form, error: null };
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
 * Form strip for a postcard: played matches up to and including `through`,
 * oldest → newest, with this match always last.
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
    .select("id, date, created_at, goals(is_opposition)")
    .eq("team_id", teamId)
    .eq("status", "played")
    .lte("date", through.date)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { form: [thisResult], error: error.message };

  const prior: Array<"W" | "D" | "L"> = [];
  for (const row of data ?? []) {
    if (!isMatchOnOrBefore(row, through) || row.id === through.id) continue;
    const { goalsFor, goalsAgainst } = scoreFromGoals(
      Array.isArray(row.goals) ? row.goals : [],
    );
    const letter = resultLetter(goalsFor, goalsAgainst);
    if (letter) prior.push(letter);
  }

  return { form: [...prior, thisResult].slice(-limit), error: null };
}
