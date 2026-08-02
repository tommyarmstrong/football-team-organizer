import { createClient } from "@/lib/supabase/server";
import {
  PERSON_EMBED,
  unwrapPerson,
  withPersonFields,
  type PersonFields,
} from "@/lib/people/person";
import type {
  Guardian,
  Person,
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

export type GuardianWithPerson = Guardian & PersonFields;

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
      .select(`id, ${PERSON_EMBED}`)
      .eq("club_id", clubId)
      .eq("active_role", true),
  ]);

  if (membersError) return { data: [], error: membersError.message };
  if (guardiansError) return { data: [], error: guardiansError.message };

  const byUser = new Map<string, GuardianWithPerson>();
  for (const g of guardians ?? []) {
    const mapped = withPersonFields(
      g as Guardian & { person: Person | Person[] | null },
    );
    if (mapped.user_id) byUser.set(mapped.user_id, mapped);
  }

  const rows: GuardianAssistantEntry[] = [];
  for (const member of members ?? []) {
    const guardian = byUser.get(member.user_id);
    if (!guardian) continue;
    rows.push({
      team_member_id: member.id,
      user_id: member.user_id,
      guardian_id: guardian.id,
      name: `${guardian.first_name} ${guardian.last_name}`.trim(),
    });
  }
  return { data: rows, error: null };
}

export async function listGuardianAssistantCandidates(
  teamId: string,
  clubId: string,
): Promise<{ data: GuardianWithPerson[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: guardians, error: guardiansError },
    { data: assistants, error: assistantsError },
  ] = await Promise.all([
    supabase
      .from("guardians")
      .select(`*, ${PERSON_EMBED}`)
      .eq("club_id", clubId),
    supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("role", "guardian_assistant"),
  ]);

  if (guardiansError) return { data: [], error: guardiansError.message };
  if (assistantsError) return { data: [], error: assistantsError.message };

  const assigned = new Set((assistants ?? []).map((r) => r.user_id));
  const mapped = (guardians ?? [])
    .map((g) =>
      withPersonFields(g as Guardian & { person: Person | Person[] | null }),
    )
    .filter((g) => g.user_id && !assigned.has(g.user_id));
  mapped.sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );
  return { data: mapped, error: null };
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

// Keep unwrapPerson available for callers that import members helpers.
export { unwrapPerson };
