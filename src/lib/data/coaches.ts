import { createClient } from "@/lib/supabase/server";
import { getCurrentTeam } from "@/lib/data/team";
import type {
  Coach,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Coach };

export async function listCoaches(
  teamId?: string,
): Promise<{ data: Coach[]; error: string | null }> {
  const team = teamId ? { id: teamId } : await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("team_id", team.id)
    .order("second_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getCoach(
  id: string,
): Promise<{ data: Coach | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .eq("team_id", team.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createCoach(
  input: Omit<TablesInsert<"coaches">, "team_id">,
): Promise<{ data: Coach | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .insert({ ...input, team_id: team.id })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateCoach(
  id: string,
  input: TablesUpdate<"coaches">,
): Promise<{ data: Coach | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .update(input)
    .eq("id", id)
    .eq("team_id", team.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function deleteCoach(
  id: string,
): Promise<{ error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaches")
    .delete()
    .eq("id", id)
    .eq("team_id", team.id);

  return { error: error?.message ?? null };
}
