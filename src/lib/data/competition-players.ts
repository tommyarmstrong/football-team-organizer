import { createClient } from "@/lib/supabase/server";
import type {
  CompetitionPlayer,
  TablesInsert,
} from "@/lib/supabase/database.types";
import { listRosterForTeam } from "@/lib/data/players";
import { rejectIfTeamArchived } from "@/lib/team/readonly-guard";

async function rejectIfCompetitionTeamArchived(
  competitionId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: competition, error } = await supabase
    .from("competitions")
    .select("team_id")
    .eq("id", competitionId)
    .maybeSingle();
  if (error) return error.message;
  if (!competition) return "Competition not found.";
  return rejectIfTeamArchived(competition.team_id);
}

export async function listCompetitionPlayers(
  competitionId: string,
): Promise<{ data: CompetitionPlayer[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competition_players")
    .select("*")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function listCompetitionPlayerIds(
  competitionId: string,
): Promise<{ data: string[]; error: string | null }> {
  const { data, error } = await listCompetitionPlayers(competitionId);
  if (error) return { data: [], error };
  return { data: data.map((row) => row.player_id), error: null };
}

export async function setCompetitionSquad(
  competitionId: string,
  playerIds: string[],
): Promise<{ error: string | null }> {
  const archivedError = await rejectIfCompetitionTeamArchived(competitionId);
  if (archivedError) return { error: archivedError };

  const supabase = await createClient();
  const uniqueIds = [...new Set(playerIds.filter(Boolean))];

  const { data: existing, error: existingError } = await supabase
    .from("competition_players")
    .select("id, player_id")
    .eq("competition_id", competitionId);

  if (existingError) return { error: existingError.message };

  const currentIds = new Set((existing ?? []).map((row) => row.player_id));
  const nextIds = new Set(uniqueIds);

  const toRemove = (existing ?? [])
    .filter((row) => !nextIds.has(row.player_id))
    .map((row) => row.id);
  const toAdd: TablesInsert<"competition_players">[] = uniqueIds
    .filter((id) => !currentIds.has(id))
    .map((player_id) => ({ competition_id: competitionId, player_id }));

  if (toRemove.length > 0) {
    const { data: removed, error } = await supabase
      .from("competition_players")
      .delete()
      .in("id", toRemove)
      .select("id");
    if (error) return { error: error.message };
    if ((removed ?? []).length !== toRemove.length) {
      return {
        error:
          "Could not update the tournament squad. You may not have permission to change it.",
      };
    }
  }

  if (toAdd.length > 0) {
    const { data: inserted, error } = await supabase
      .from("competition_players")
      .insert(toAdd)
      .select("id");
    if (error) return { error: error.message };
    if ((inserted ?? []).length !== toAdd.length) {
      return {
        error:
          "Could not update the tournament squad. You may not have permission to change it.",
      };
    }
  }

  return { error: null };
}

/** Active team-squad players, used as the default tournament squad. */
export async function seedDefaultTournamentSquad(
  competitionId: string,
  teamId: string,
): Promise<{ error: string | null }> {
  const { data, error } = await listRosterForTeam(teamId);
  if (error) return { error };
  if (data.length === 0) return { error: null };
  return setCompetitionSquad(
    competitionId,
    data.map((player) => player.id),
  );
}

/** Fill an empty tournament squad. Leaves a squad the user already edited. */
export async function ensureTournamentSquad(
  competitionId: string,
  teamId: string,
): Promise<{ error: string | null }> {
  const existing = await listCompetitionPlayerIds(competitionId);
  if (existing.error) return { error: existing.error };
  if (existing.data.length > 0) return { error: null };
  return seedDefaultTournamentSquad(competitionId, teamId);
}

/**
 * Players to copy onto a new match. Tournament matches start from the
 * tournament squad (players still on the team). Every other match starts
 * from the active team squad.
 */
export async function initialMatchSquadPlayerIds(
  teamId: string,
  competitionId: string | null,
): Promise<{ data: string[]; error: string | null }> {
  if (competitionId) {
    const supabase = await createClient();
    const { data: competition, error } = await supabase
      .from("competitions")
      .select("kind")
      .eq("id", competitionId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (error) return { data: [], error: error.message };

    if (competition?.kind === "tournament") {
      const [squad, roster] = await Promise.all([
        listCompetitionPlayerIds(competitionId),
        listRosterForTeam(teamId, { includeInactive: true }),
      ]);
      if (squad.error) return { data: [], error: squad.error };
      if (roster.error) return { data: [], error: roster.error };
      const onTeam = new Set(roster.data.map((player) => player.id));
      return {
        data: squad.data.filter((id) => onTeam.has(id)),
        error: null,
      };
    }
  }

  const { data, error } = await listRosterForTeam(teamId);
  if (error) return { data: [], error };
  return { data: data.map((player) => player.id), error: null };
}
