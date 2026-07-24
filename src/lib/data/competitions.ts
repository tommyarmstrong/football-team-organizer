import { createClient } from "@/lib/supabase/server";
import { getCurrentTeam } from "@/lib/data/team";
import type {
  Competition,
  CompetitionKind,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Competition };

export async function listCompetitions(
  teamId?: string,
): Promise<{ data: Competition[]; error: string | null }> {
  const team = teamId ? { id: teamId } : await getCurrentTeam();
  if (!team) {
    return { data: [], error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("team_id", team.id)
    .order("name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function createCompetition(input: {
  name: string;
  kind: CompetitionKind | null;
}): Promise<{ data: Competition | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .insert({
      team_id: team.id,
      name: input.name,
      kind: input.kind,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateCompetition(
  id: string,
  input: TablesUpdate<"competitions">,
): Promise<{ data: Competition | null; error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { data: null, error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
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

export async function deleteCompetition(
  id: string,
): Promise<{ error: string | null }> {
  const team = await getCurrentTeam();
  if (!team) {
    return { error: "No team found for your account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", id)
    .eq("team_id", team.id);

  return { error: error?.message ?? null };
}
