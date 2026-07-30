import { createClient } from "@/lib/supabase/server";
import type {
  PlayerDevelopmentObjective,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { PlayerDevelopmentObjective };

export async function listPlayerObjectives(
  playerId: string,
): Promise<{ data: PlayerDevelopmentObjective[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_development_objectives")
    .select("*")
    .eq("player_id", playerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getPlayerObjective(
  id: string,
): Promise<{ data: PlayerDevelopmentObjective | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_development_objectives")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createPlayerObjective(
  input: TablesInsert<"player_development_objectives">,
): Promise<{ data: PlayerDevelopmentObjective | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_development_objectives")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updatePlayerObjective(
  id: string,
  input: TablesUpdate<"player_development_objectives">,
): Promise<{ data: PlayerDevelopmentObjective | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_development_objectives")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deletePlayerObjective(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_development_objectives")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}
