import { createClient } from "@/lib/supabase/server";
import type {
  Coach,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Coach };

export type CoachTeamMembership = {
  team_coach_id: string;
  team_id: string;
  team_name: string;
  role: string | null;
};

export type CoachWithTeams = Coach & {
  teams: CoachTeamMembership[];
};

/** Club-level directory of coaching staff the user can see (RLS-filtered). */
export async function listCoaches(): Promise<{
  data: CoachWithTeams[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*, team_coaches(id, team_id, role, team:teams(name))")
    .order("second_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows: CoachWithTeams[] = (data ?? []).map((row) => {
    const { team_coaches, ...coach } = row as Coach & {
      team_coaches: Array<{
        id: string;
        team_id: string;
        role: string | null;
        team: { name: string } | { name: string }[] | null;
      }>;
    };
    const teams: CoachTeamMembership[] = (team_coaches ?? []).map((tc) => {
      const team = Array.isArray(tc.team) ? tc.team[0] : tc.team;
      return {
        team_coach_id: tc.id,
        team_id: tc.team_id,
        team_name: team?.name ?? "",
        role: tc.role,
      };
    });
    return { ...(coach as Coach), teams };
  });

  return { data: rows, error: null };
}

export async function getCoach(
  id: string,
): Promise<{ data: Coach | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getCoachTeams(
  coachId: string,
): Promise<{ data: CoachTeamMembership[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_coaches")
    .select("id, team_id, role, team:teams(name)")
    .eq("coach_id", coachId);

  if (error) return { data: [], error: error.message };

  const rows: CoachTeamMembership[] = (data ?? []).map((tc) => {
    const team = Array.isArray(tc.team) ? tc.team[0] : tc.team;
    return {
      team_coach_id: tc.id,
      team_id: tc.team_id,
      team_name: team?.name ?? "",
      role: tc.role,
    };
  });

  return { data: rows, error: null };
}

export async function createCoach(
  input: TablesInsert<"coaches">,
): Promise<{ data: Coach | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateCoach(
  id: string,
  input: TablesUpdate<"coaches">,
): Promise<{ data: Coach | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteCoach(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type TeamCoachEntry = {
  team_coach_id: string;
  coach_id: string;
  name: string;
  role: string | null;
};

export async function listTeamCoaches(
  teamId: string,
): Promise<{ data: TeamCoachEntry[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_coaches")
    .select("id, coach_id, role, coach:coaches(first_name, second_name)")
    .eq("team_id", teamId);

  if (error) return { data: [], error: error.message };

  const rows: TeamCoachEntry[] = (data ?? []).map((tc) => {
    const coach = Array.isArray(tc.coach) ? tc.coach[0] : tc.coach;
    return {
      team_coach_id: tc.id,
      coach_id: tc.coach_id,
      name: coach ? `${coach.first_name} ${coach.second_name}` : "",
      role: tc.role,
    };
  });

  return { data: rows, error: null };
}

export async function addCoachToTeam(
  teamId: string,
  coachId: string,
  role: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_coaches").insert({
    team_id: teamId,
    coach_id: coachId,
    role,
  });
  if (error?.message.includes("team_coaches_team_coach_unique")) {
    return { error: "That coach is already assigned to this team." };
  }
  return { error: error?.message ?? null };
}

export async function removeCoachFromTeam(
  teamCoachId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_coaches")
    .delete()
    .eq("id", teamCoachId);
  return { error: error?.message ?? null };
}

const HEAD_COACH_ROLE = "Head Coach";

/** Set (or clear) the team's Head Coach assignment in team_coaches. */
export async function setTeamHeadCoach(
  teamId: string,
  coachId: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: existing, error: listError } = await supabase
    .from("team_coaches")
    .select("id, coach_id, role")
    .eq("team_id", teamId);

  if (listError) return { error: listError.message };

  const rows = existing ?? [];
  const previousHeads = rows.filter(
    (r) => r.role === HEAD_COACH_ROLE && r.coach_id !== coachId,
  );

  for (const row of previousHeads) {
    const { error } = await supabase
      .from("team_coaches")
      .update({ role: "Assistant Coach" })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }

  if (!coachId) return { error: null };

  const already = rows.find((r) => r.coach_id === coachId);
  if (already) {
    if (already.role === HEAD_COACH_ROLE) return { error: null };
    const { error } = await supabase
      .from("team_coaches")
      .update({ role: HEAD_COACH_ROLE })
      .eq("id", already.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("team_coaches").insert({
    team_id: teamId,
    coach_id: coachId,
    role: HEAD_COACH_ROLE,
  });
  return { error: error?.message ?? null };
}

/** Coaches in a club not currently assigned to the given team. */
export async function listCoachesNotOnTeam(
  clubId: string,
  teamId: string,
): Promise<{ data: Coach[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: coaches, error: coachesError },
    { data: assigned, error: assignedError },
  ] = await Promise.all([
    supabase
      .from("coaches")
      .select("*")
      .eq("club_id", clubId)
      .order("second_name", { ascending: true }),
    supabase.from("team_coaches").select("coach_id").eq("team_id", teamId),
  ]);

  if (coachesError) return { data: [], error: coachesError.message };
  if (assignedError) return { data: [], error: assignedError.message };

  const onTeam = new Set((assigned ?? []).map((r) => r.coach_id));
  return {
    data: (coaches ?? []).filter((c) => !onTeam.has(c.id)),
    error: null,
  };
}
