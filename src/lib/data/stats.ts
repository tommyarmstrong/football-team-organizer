import { createClient } from "@/lib/supabase/server";
import { getCurrentTeam } from "@/lib/data/team";
import { resultLetter } from "@/lib/format";
import type { Match, Player } from "@/lib/supabase/database.types";

export type TopScorer = {
  player: Pick<
    Player,
    "id" | "first_name" | "last_name" | "shirt_number" | "position"
  >;
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
  const team = await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select(
      "player_id, player:players!goals_player_id_fkey(id, first_name, last_name, shirt_number, position, team_id), match:matches!inner(team_id, status)",
    )
    .eq("match.team_id", team.id)
    .eq("match.status", "played");

  if (error) {
    return { data: [], error: error.message };
  }

  const counts = new Map<string, TopScorer>();

  for (const row of data ?? []) {
    const player = Array.isArray(row.player) ? row.player[0] : row.player;
    if (!player || player.team_id !== team.id) continue;
    const existing = counts.get(player.id);
    if (existing) {
      existing.goals += 1;
    } else {
      counts.set(player.id, {
        player: {
          id: player.id,
          first_name: player.first_name,
          last_name: player.last_name,
          shirt_number: player.shirt_number,
          position: player.position,
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
  const team = await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account.", form: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, date, opponent_name, goals_for, goals_against, status")
    .eq("team_id", team.id)
    .eq("status", "played")
    .order("date", { ascending: true });

  if (error) {
    return { data: [], error: error.message, form: [] };
  }

  const points: ResultOverTimePoint[] = [];
  const form: Array<"W" | "D" | "L"> = [];

  for (const match of (data ?? []) as Pick<
    Match,
    "id" | "date" | "opponent_name" | "goals_for" | "goals_against"
  >[]) {
    const letter = resultLetter(match.goals_for, match.goals_against);
    if (!letter || match.goals_for == null || match.goals_against == null) {
      continue;
    }
    form.push(letter);
    points.push({
      matchId: match.id,
      date: match.date,
      label: match.opponent_name,
      goalsFor: match.goals_for,
      goalsAgainst: match.goals_against,
      result: letter,
    });
  }

  return { data: points, error: null, form };
}
