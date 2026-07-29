import { createClient } from "@/lib/supabase/server";
import type {
  Guardian,
  TeamMember,
  TablesInsert,
} from "@/lib/supabase/database.types";

export type { TeamMember };

export type GuardianAssistantEntry = {
  team_member_id: string;
  user_id: string;
  guardian_id: string;
  name: string;
};

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

export async function listGuardianAssistants(
  teamId: string,
  clubId: string,
): Promise<{ data: GuardianAssistantEntry[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: members, error: membersError },
    { data: guardians, error: guardiansError },
  ] = await Promise.all([
    supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("role", "guardian_assistant"),
    supabase
      .from("guardians")
      .select("id, user_id, first_name, second_name")
      .eq("club_id", clubId)
      .not("user_id", "is", null),
  ]);

  if (membersError) return { data: [], error: membersError.message };
  if (guardiansError) return { data: [], error: guardiansError.message };

  const byUser = new Map(
    (guardians ?? [])
      .filter((g): g is typeof g & { user_id: string } => Boolean(g.user_id))
      .map((g) => [g.user_id, g]),
  );

  const rows: GuardianAssistantEntry[] = [];
  for (const member of members ?? []) {
    const guardian = byUser.get(member.user_id);
    if (!guardian) continue;
    rows.push({
      team_member_id: member.id,
      user_id: member.user_id,
      guardian_id: guardian.id,
      name: `${guardian.first_name} ${guardian.second_name}`.trim(),
    });
  }
  return { data: rows, error: null };
}

export async function listGuardianAssistantCandidates(
  teamId: string,
  clubId: string,
): Promise<{ data: Guardian[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: guardians, error: guardiansError },
    { data: assistants, error: assistantsError },
  ] = await Promise.all([
    supabase
      .from("guardians")
      .select("*")
      .eq("club_id", clubId)
      .not("user_id", "is", null)
      .order("second_name", { ascending: true }),
    supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("role", "guardian_assistant"),
  ]);

  if (guardiansError) return { data: [], error: guardiansError.message };
  if (assistantsError) return { data: [], error: assistantsError.message };

  const assigned = new Set((assistants ?? []).map((r) => r.user_id));
  return {
    data: (guardians ?? []).filter(
      (g) => g.user_id && !assigned.has(g.user_id),
    ),
    error: null,
  };
}

export async function addTeamMember(
  input: TablesInsert<"team_members">,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert(input);
  if (error?.message.includes("team_members_team_user_role_unique")) {
    return { error: "That user already has that role on this team." };
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
