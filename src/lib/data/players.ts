import { createClient } from "@/lib/supabase/server";
import { getActiveTeam } from "@/lib/data/team";
import type {
  Goal,
  Player,
  PlayerContact,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Player, PlayerContact };

/** A player as they appear on a team roster (identity + per-team squad info). */
export type RosterPlayer = {
  id: string; // player id (used as goals.player_id)
  team_player_id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  shirt_number: number | null;
  active: boolean;
};

export type PlayerTeamMembership = {
  team_player_id: string;
  team_id: string;
  team_name: string;
  shirt_number: number | null;
  active: boolean;
};

export type PlayerWithTeams = Player & {
  teams: PlayerTeamMembership[];
};

/** Club-level directory of all players the user can see (RLS-filtered). */
export async function listPlayers(): Promise<{
  data: PlayerWithTeams[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select(
      "*, team_players(id, team_id, shirt_number, active, team:teams(name))",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows: PlayerWithTeams[] = (data ?? []).map((row) => {
    const { team_players, ...player } = row as Player & {
      team_players: Array<{
        id: string;
        team_id: string;
        shirt_number: number | null;
        active: boolean;
        team: { name: string } | { name: string }[] | null;
      }>;
    };
    const teams: PlayerTeamMembership[] = (team_players ?? []).map((tp) => {
      const team = Array.isArray(tp.team) ? tp.team[0] : tp.team;
      return {
        team_player_id: tp.id,
        team_id: tp.team_id,
        team_name: team?.name ?? "",
        shirt_number: tp.shirt_number,
        active: tp.active,
      };
    });
    return { ...(player as Player), teams };
  });

  return { data: rows, error: null };
}

/** Active roster for a team, used for goal scorer pickers. */
export async function listRosterForTeam(
  teamId: string,
  options?: { includeInactive?: boolean },
): Promise<{ data: RosterPlayer[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("team_players")
    .select("id, shirt_number, active, player:players(*)")
    .eq("team_id", teamId);

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  const rows: RosterPlayer[] = (data ?? [])
    .map((row) => {
      const player = (
        Array.isArray(row.player) ? row.player[0] : row.player
      ) as Player | undefined;
      if (!player) return null;
      return {
        id: player.id,
        team_player_id: row.id,
        first_name: player.first_name,
        last_name: player.last_name,
        position: player.position,
        shirt_number: row.shirt_number,
        active: row.active,
      } satisfies RosterPlayer;
    })
    .filter((row): row is RosterPlayer => row !== null)
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const an = a.shirt_number ?? Number.MAX_SAFE_INTEGER;
      const bn = b.shirt_number ?? Number.MAX_SAFE_INTEGER;
      if (an !== bn) return an - bn;
      return a.last_name.localeCompare(b.last_name);
    });

  return { data: rows, error: null };
}

export async function getPlayer(
  id: string,
): Promise<{ data: Player | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPlayerTeams(
  playerId: string,
): Promise<{ data: PlayerTeamMembership[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_players")
    .select("id, team_id, shirt_number, active, team:teams(name)")
    .eq("player_id", playerId);

  if (error) return { data: [], error: error.message };

  const rows: PlayerTeamMembership[] = (data ?? []).map((tp) => {
    const team = Array.isArray(tp.team) ? tp.team[0] : tp.team;
    return {
      team_player_id: tp.id,
      team_id: tp.team_id,
      team_name: team?.name ?? "",
      shirt_number: tp.shirt_number,
      active: tp.active,
    };
  });

  return { data: rows, error: null };
}

/** Sensitive contact details. Returns null when not present or not permitted (RLS). */
export async function getPlayerContact(
  playerId: string,
): Promise<{ data: PlayerContact | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_contacts")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getPlayerGoals(playerId: string): Promise<{
  data: (Goal & { match_date: string; opponent_name: string })[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*, match:matches!inner(date, opponent_name, status)")
    .eq("player_id", playerId)
    .eq("match.status", "played")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []).map((row) => {
    const match = Array.isArray(row.match) ? row.match[0] : row.match;
    return {
      id: row.id,
      match_id: row.match_id,
      player_id: row.player_id,
      assist_player_id: row.assist_player_id,
      period: row.period,
      minute: row.minute,
      is_penalty: row.is_penalty,
      is_freekick: row.is_freekick,
      from_setpiece: row.from_setpiece,
      created_at: row.created_at,
      match_date: match?.date ?? "",
      opponent_name: match?.opponent_name ?? "",
    };
  });

  return { data: rows, error: null };
}

export async function createPlayer(
  input: TablesInsert<"players">,
): Promise<{ data: Player | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePlayer(
  id: string,
  input: TablesUpdate<"players">,
): Promise<{ data: Player | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deletePlayer(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function upsertPlayerContact(
  playerId: string,
  input: Omit<TablesInsert<"player_contacts">, "player_id">,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_contacts")
    .upsert({ player_id: playerId, ...input }, { onConflict: "player_id" });
  return { error: error?.message ?? null };
}

/** Add a player to a team's squad (roster junction). */
export async function addPlayerToTeam(
  teamId: string,
  playerId: string,
  shirtNumber: number | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_players").insert({
    team_id: teamId,
    player_id: playerId,
    shirt_number: shirtNumber,
    active: true,
  });
  return { error: friendlyRosterError(error?.message ?? null) };
}

export async function updateRosterEntry(
  teamPlayerId: string,
  input: TablesUpdate<"team_players">,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_players")
    .update(input)
    .eq("id", teamPlayerId);
  return { error: friendlyRosterError(error?.message ?? null) };
}

export async function removePlayerFromTeam(
  teamPlayerId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_players")
    .delete()
    .eq("id", teamPlayerId);
  return { error: error?.message ?? null };
}

/** Players in a club not currently on the given team (candidates to add). */
export async function listPlayersNotOnTeam(
  clubId: string,
  teamId: string,
): Promise<{ data: Player[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: players, error: playersError },
    { data: roster, error: rosterError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("club_id", clubId)
      .order("last_name", { ascending: true }),
    supabase.from("team_players").select("player_id").eq("team_id", teamId),
  ]);

  if (playersError) return { data: [], error: playersError.message };
  if (rosterError) return { data: [], error: rosterError.message };

  const onTeam = new Set((roster ?? []).map((r) => r.player_id));
  return {
    data: (players ?? []).filter((p) => !onTeam.has(p.id)),
    error: null,
  };
}

/** Convenience: active roster for the active team. */
export async function listActiveRosterForActiveTeam(): Promise<{
  data: RosterPlayer[];
  error: string | null;
}> {
  const team = await getActiveTeam();
  if (!team) return { data: [], error: "No team selected." };
  return listRosterForTeam(team.id);
}

function friendlyRosterError(message: string | null): string | null {
  if (!message) return null;
  if (message.includes("team_players_shirt_number_uidx")) {
    return "That shirt number is already used in this team.";
  }
  if (message.includes("team_players_team_player_unique")) {
    return "That player is already on this team.";
  }
  return message;
}
