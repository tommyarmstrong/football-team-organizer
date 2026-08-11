import { createClient } from "@/lib/supabase/server";
import { getActiveTeam } from "@/lib/data/team";
import { resultLetter, scoreFromGoals } from "@/lib/format";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
} from "@/lib/people/named-player";
import type { CompetitionKind } from "@/lib/supabase/database.types";
import { STATS_FORM_LIMIT } from "@/lib/constants";

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
  }>;
};

export type PlayerCountPoint = {
  playerId: string;
  name: string;
  count: number;
  matchesPlayed?: number;
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
};

async function getShirtByPlayer(
  teamId: string,
): Promise<Map<string, number | null>> {
  const supabase = await createClient();
  const { data: roster } = await supabase
    .from("team_players")
    .select("player_id, shirt_number")
    .eq("team_id", teamId);

  return new Map<string, number | null>(
    (roster ?? []).map((r) => [r.player_id, r.shirt_number]),
  );
}

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

export async function getTopScorers(
  limit = 5,
): Promise<{ data: TopScorer[]; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };

  const supabase = await createClient();
  const [{ data, error }, { data: roster }] = await Promise.all([
    supabase
      .from("goals")
      .select(
        `player_id, player:players!goals_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id, status)`,
      )
      .eq("match.team_id", team.id)
      .eq("match.status", "played")
      .eq("is_opposition", false),
    supabase
      .from("team_players")
      .select("player_id, shirt_number")
      .eq("team_id", team.id),
  ]);

  if (error) return { data: [], error: error.message };

  const shirtByPlayer = new Map<string, number | null>(
    (roster ?? []).map((r) => [r.player_id, r.shirt_number]),
  );

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
      `player_id, player:players!goals_player_id_fkey(${PLAYER_NAME_EMBED}, position), match:matches!inner(team_id, status, competition_id, competition:competitions(id, kind))`,
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
    const existing = byPlayer.get(player.id);
    if (existing) {
      existing.goals += 1;
      existing.goalCompetitions.push({ competitionId, competitionKind });
      continue;
    }
    byPlayer.set(player.id, {
      playerId: player.id,
      name: `${player.first_name} ${player.last_name}`,
      goals: 1,
      position,
      matchesPlayed: 0,
      periodsPlayed: 0,
      goalCompetitions: [{ competitionId, competitionKind }],
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

  const { data, error } = await getTopAssists(50);
  if (error) return { data: [], error };
  if (data.length === 0) return { data: [], error: null };

  const supabase = await createClient();
  const playerIds = data.map((row) => row.player.id);
  const matchesPlayedByPlayer = new Map<string, number>(
    playerIds.map((id) => [id, 0]),
  );

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
      const current = matchesPlayedByPlayer.get(row.player_id) ?? 0;
      matchesPlayedByPlayer.set(row.player_id, current + 1);
    }
  }

  return {
    data: data.map((row) => ({
      playerId: row.player.id,
      name: `${row.player.first_name} ${row.player.last_name}`,
      count: row.count,
      matchesPlayed: matchesPlayedByPlayer.get(row.player.id) ?? 0,
    })),
    error: null,
  };
}

export async function getPlayerOfTheMatchByPlayerStats(): Promise<{
  data: PlayerCountPoint[];
  error: string | null;
}> {
  const { data, error } = await getTopPlayersOfTheMatch(50);
  if (error) return { data: [], error };

  return {
    data: data.map((row) => ({
      playerId: row.player.id,
      name: `${row.player.first_name} ${row.player.last_name}`,
      count: row.count,
    })),
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
      `player_id, player:players!match_players_player_id_fkey(${PLAYER_NAME_EMBED}), match:matches!inner(team_id)`,
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
    const existing = counts.get(player.id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(player.id, {
        playerId: player.id,
        name: `${player.first_name} ${player.last_name}`,
        count: 1,
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
      "id, date, opponent_name, status, competition_id, competition:competitions(id, name, kind), goals(is_opposition)",
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
      competitionName: competitionRaw?.name ?? null,
    });
  }

  const recentForm = form.slice(-STATS_FORM_LIMIT);

  return { data: points, error: null, form: recentForm };
}
