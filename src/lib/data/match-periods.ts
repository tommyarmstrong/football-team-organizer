import { createClient } from "@/lib/supabase/server";
import {
  mapPlayerNameEmbed,
  PLAYER_NAME_EMBED,
  type NamedPlayer,
} from "@/lib/people/named-player";
import type {
  MatchPeriod,
  MatchPeriodStarter,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type MatchPeriodWithStarters = MatchPeriod & {
  starters: NamedPlayer[];
  starter_player_ids: string[];
};

type PeriodRow = MatchPeriod & {
  starters:
    | {
        id: string;
        player_id: string;
        player: unknown;
      }[]
    | null;
};

function mapPeriodRow(row: PeriodRow): MatchPeriodWithStarters {
  const starterRows = Array.isArray(row.starters) ? row.starters : [];
  const starters: NamedPlayer[] = [];
  const starter_player_ids: string[] = [];

  for (const s of starterRows) {
    const playerRaw = Array.isArray(s.player) ? s.player[0] : s.player;
    const player = mapPlayerNameEmbed(
      playerRaw as Parameters<typeof mapPlayerNameEmbed>[0],
    );
    if (!player) continue;
    starters.push(player);
    starter_player_ids.push(player.id);
  }

  return {
    id: row.id,
    match_id: row.match_id,
    name: row.name,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    starters,
    starter_player_ids,
  };
}

const PERIOD_SELECT = `*, starters:match_period_starters(id, player_id, player:players(${PLAYER_NAME_EMBED}))`;

export async function listPeriodsForMatch(
  matchId: string,
): Promise<{ data: MatchPeriodWithStarters[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_periods")
    .select(PERIOD_SELECT)
    .eq("match_id", matchId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map((row) => mapPeriodRow(row as PeriodRow)),
    error: null,
  };
}

export async function getPeriod(
  periodId: string,
): Promise<{ data: MatchPeriodWithStarters | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_periods")
    .select(PERIOD_SELECT)
    .eq("id", periodId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: mapPeriodRow(data as PeriodRow), error: null };
}

export async function createPeriod(
  input: TablesInsert<"match_periods">,
): Promise<{ data: MatchPeriod | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_periods")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePeriod(
  id: string,
  input: TablesUpdate<"match_periods">,
): Promise<{ data: MatchPeriod | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_periods")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  if (input.name) {
    const { error: goalsError } = await supabase
      .from("goals")
      .update({ period: input.name })
      .eq("period_id", id);
    if (goalsError) return { data: null, error: goalsError.message };
  }

  return { data, error: null };
}

export async function deletePeriod(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("match_periods").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function setPeriodStarters(
  periodId: string,
  playerIds: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const uniqueIds = [...new Set(playerIds.filter(Boolean))];

  const { data: existing, error: existingError } = await supabase
    .from("match_period_starters")
    .select("id, player_id")
    .eq("period_id", periodId);

  if (existingError) return { error: existingError.message };

  const currentIds = new Set((existing ?? []).map((r) => r.player_id));
  const nextIds = new Set(uniqueIds);

  const toRemove = (existing ?? [])
    .filter((r) => !nextIds.has(r.player_id))
    .map((r) => r.id);
  const toAdd: TablesInsert<"match_period_starters">[] = uniqueIds
    .filter((id) => !currentIds.has(id))
    .map((player_id) => ({ period_id: periodId, player_id }));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("match_period_starters")
      .delete()
      .in("id", toRemove);
    if (error) return { error: error.message };
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("match_period_starters")
      .insert(toAdd);
    if (error) return { error: error.message };
  }

  return { error: null };
}

export type { MatchPeriod, MatchPeriodStarter };
