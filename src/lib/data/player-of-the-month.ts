import { createClient } from "@/lib/supabase/server";
import { getActiveTeam } from "@/lib/data/team";
import { archivedTeamWriteError } from "@/lib/team/season";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
  type NamedPlayer,
} from "@/lib/people/named-player";
import type {
  PlayerOfTheMonth,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type PlayerOfTheMonthWithPlayer = PlayerOfTheMonth & {
  player: NamedPlayer;
};

function mapRow(
  row: PlayerOfTheMonth & {
    player:
      | {
          id: string;
          person_id?: string;
          person?:
            | { first_name: string; last_name: string }
            | { first_name: string; last_name: string }[]
            | null;
        }
      | {
          id: string;
          person_id?: string;
          person?:
            | { first_name: string; last_name: string }
            | { first_name: string; last_name: string }[]
            | null;
        }[]
      | null;
  },
): PlayerOfTheMonthWithPlayer | null {
  const playerRaw = Array.isArray(row.player) ? row.player[0] : row.player;
  const player = mapPlayerNameEmbed(playerRaw);
  if (!player) return null;
  return {
    id: row.id,
    team_id: row.team_id,
    player_id: row.player_id,
    month: row.month,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    player,
  };
}

export async function listPlayerOfTheMonth(
  teamId?: string,
  limit?: number,
): Promise<{ data: PlayerOfTheMonthWithPlayer[]; error: string | null }> {
  const team = teamId ? { id: teamId } : await getActiveTeam();
  if (!team) return { data: [], error: "No team found for your account." };

  const supabase = await createClient();
  let query = supabase
    .from("player_of_the_month")
    .select(
      `*, player:players!player_of_the_month_player_id_fkey(${PLAYER_NAME_EMBED})`,
    )
    .eq("team_id", team.id)
    .order("month", { ascending: false });

  if (limit != null) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  const mapped = (data ?? [])
    .map((row) => mapRow(row as Parameters<typeof mapRow>[0]))
    .filter((row): row is PlayerOfTheMonthWithPlayer => row != null);

  return { data: mapped, error: null };
}

export async function getPlayerOfTheMonth(
  id: string,
): Promise<{ data: PlayerOfTheMonthWithPlayer | null; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: null, error: "No team found for your account." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_of_the_month")
    .select(
      `*, player:players!player_of_the_month_player_id_fkey(${PLAYER_NAME_EMBED})`,
    )
    .eq("id", id)
    .eq("team_id", team.id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return {
    data: mapRow(data as Parameters<typeof mapRow>[0]),
    error: null,
  };
}

export async function createPlayerOfTheMonth(
  input: Omit<TablesInsert<"player_of_the_month">, "team_id">,
): Promise<{ data: PlayerOfTheMonth | null; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: null, error: "No team found for your account." };
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { data: null, error: archivedError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_of_the_month")
    .insert({ ...input, team_id: team.id })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePlayerOfTheMonth(
  id: string,
  input: TablesUpdate<"player_of_the_month">,
): Promise<{ data: PlayerOfTheMonth | null; error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { data: null, error: "No team found for your account." };
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { data: null, error: archivedError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_of_the_month")
    .update(input)
    .eq("id", id)
    .eq("team_id", team.id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deletePlayerOfTheMonth(
  id: string,
): Promise<{ error: string | null }> {
  const team = await getActiveTeam();
  if (!team) return { error: "No team found for your account." };
  const archivedError = archivedTeamWriteError(team);
  if (archivedError) return { error: archivedError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("player_of_the_month")
    .delete()
    .eq("id", id)
    .eq("team_id", team.id);

  return { error: error?.message ?? null };
}
