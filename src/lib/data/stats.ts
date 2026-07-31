import { createClient } from "@/lib/supabase/server";
import { getActiveTeam } from "@/lib/data/team";
import { resultLetter, scoreFromGoals } from "@/lib/format";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
} from "@/lib/people/named-player";

export type TopScorer = {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    shirt_number: number | null;
  };
  goals: number;
};

export type GoalsByPlayerPoint = {
  playerId: string;
  name: string;
  goals: number;
};

export type ResultOverTimePoint = {
  matchId: string;
  date: string;
  label: string;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
};

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

export async function getGoalsByPlayerStats(): Promise<{
  data: GoalsByPlayerPoint[];
  error: string | null;
}> {
  const { data, error } = await getTopScorers(50);
  if (error) return { data: [], error };

  return {
    data: data.map((row) => ({
      playerId: row.player.id,
      name: `${row.player.first_name} ${row.player.last_name}`,
      goals: row.goals,
    })),
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
    .select("id, date, opponent_name, status, goals(is_opposition)")
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
    points.push({
      matchId: match.id,
      date: match.date,
      label: match.opponent_name,
      goalsFor,
      goalsAgainst,
      result: letter,
    });
  }

  return { data: points, error: null, form };
}
