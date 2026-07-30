import { createClient } from "@/lib/supabase/server";
import type {
  CoachDevelopmentObjective,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { CoachDevelopmentObjective };

export async function listCoachObjectives(
  coachId: string,
): Promise<{ data: CoachDevelopmentObjective[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_development_objectives")
    .select("*")
    .eq("coach_id", coachId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function createCoachObjective(
  input: TablesInsert<"coach_development_objectives">,
): Promise<{ data: CoachDevelopmentObjective | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_development_objectives")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateCoachObjective(
  id: string,
  input: TablesUpdate<"coach_development_objectives">,
): Promise<{ data: CoachDevelopmentObjective | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_development_objectives")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteCoachObjective(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_development_objectives")
    .delete()
    .eq("id", id);
  return { error: error?.message ?? null };
}
