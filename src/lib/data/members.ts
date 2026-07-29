import { createClient } from "@/lib/supabase/server";
import type { TeamMember, TablesInsert } from "@/lib/supabase/database.types";

export async function listTeamMembers(
  teamId: string,
): Promise<{ data: TeamMember[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("role", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function addTeamMember(
  input: TablesInsert<"team_members">,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert(input);
  if (error?.message.includes("team_members_team_user_unique")) {
    return { error: "That user already has a role on this team." };
  }
  return { error: error?.message ?? null };
}

export async function removeTeamMember(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  return { error: error?.message ?? null };
}
