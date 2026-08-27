import { createClient } from "@/lib/supabase/server";
import type { MatchPlayer, TablesInsert } from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { rejectIfMatchTeamArchived } from "@/lib/team/readonly-guard";

export type MatchSquadPlayer = RosterPlayer & {
  match_player_id: string;
};

export async function listMatchPlayers(
  matchId: string,
): Promise<{ data: MatchPlayer[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_players")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

/** Match-day available players, enriched with roster shirt/active info. */
export async function listMatchSquad(
  matchId: string,
  roster: RosterPlayer[],
): Promise<{ data: MatchSquadPlayer[]; error: string | null }> {
  const { data: rows, error } = await listMatchPlayers(matchId);
  if (error) return { data: [], error };

  const byId = new Map(roster.map((p) => [p.id, p]));
  const squad: MatchSquadPlayer[] = [];

  for (const row of rows) {
    const player = byId.get(row.player_id);
    if (!player) continue;
    squad.push({ ...player, match_player_id: row.id });
  }

  return { data: squad, error: null };
}

export async function setMatchSquad(
  matchId: string,
  playerIds: string[],
): Promise<{ error: string | null }> {
  const archivedError = await rejectIfMatchTeamArchived(matchId);
  if (archivedError) return { error: archivedError };

  const supabase = await createClient();
  const uniqueIds = [...new Set(playerIds.filter(Boolean))];

  const { data: existing, error: existingError } = await supabase
    .from("match_players")
    .select("id, player_id")
    .eq("match_id", matchId);

  if (existingError) return { error: existingError.message };

  const currentIds = new Set((existing ?? []).map((r) => r.player_id));
  const nextIds = new Set(uniqueIds);

  const toRemove = (existing ?? [])
    .filter((r) => !nextIds.has(r.player_id))
    .map((r) => r.id);
  const toAdd: TablesInsert<"match_players">[] = uniqueIds
    .filter((id) => !currentIds.has(id))
    .map((player_id) => ({ match_id: matchId, player_id }));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("match_players")
      .delete()
      .in("id", toRemove);
    if (error) return { error: error.message };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("match_players").insert(toAdd);
    if (error) return { error: error.message };
  }

  return { error: null };
}
