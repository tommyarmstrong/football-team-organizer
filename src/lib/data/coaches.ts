import { createClient } from "@/lib/supabase/server";
import { createPerson, updatePerson } from "@/lib/data/people";
import {
  PERSON_EMBED,
  withPersonFields,
  type PersonFields,
} from "@/lib/people/person";
import type {
  Coach,
  Person,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { CoachFormFields } from "@/lib/coaches/parse";

export type CoachWithPerson = Coach & PersonFields;
export type { Coach };

export type CoachTeamMembership = {
  team_coach_id: string;
  team_id: string;
  team_name: string;
  role: string | null;
};

export type CoachWithTeams = CoachWithPerson & {
  teams: CoachTeamMembership[];
};

function mapCoach(
  row: Coach & { person: Person | Person[] | null },
): CoachWithPerson {
  return withPersonFields(row);
}

/** Club-level directory of coaching staff the user can see (RLS-filtered). */
export async function listCoaches(): Promise<{
  data: CoachWithTeams[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select(
      `*, ${PERSON_EMBED}, team_coaches(id, team_id, role, team:teams(name))`,
    );

  if (error) return { data: [], error: error.message };

  const rows: CoachWithTeams[] = (data ?? []).map((row) => {
    const { team_coaches, ...coach } = row as Coach & {
      person: Person | Person[] | null;
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
    return { ...mapCoach(coach), teams };
  });

  rows.sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );

  return { data: rows, error: null };
}

export async function getCoach(
  id: string,
): Promise<{ data: CoachWithPerson | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select(`*, ${PERSON_EMBED}`)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: mapCoach(data as Coach & { person: Person | Person[] | null }),
    error: null,
  };
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
  input: CoachFormFields & { club_id: string; person_id?: string },
): Promise<{ data: CoachWithPerson | null; error: string | null }> {
  let personId = input.person_id;
  if (!personId) {
    const { data: person, error: personError } = await createPerson({
      first_name: input.first_name,
      last_name: input.second_name,
      phone: input.phone,
      email: input.email,
      account_status: "none",
    });
    if (personError) return { data: null, error: personError };
    if (!person) return { data: null, error: "Could not create person." };
    personId = person.id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .insert({
      club_id: input.club_id,
      person_id: personId,
      joined_date: input.joined_date,
      date_of_birth: input.date_of_birth,
      dbs_checked: input.dbs_checked,
      fa_level_1: input.fa_level_1,
      fa_level_2: input.fa_level_2,
      notes: input.notes,
      biography: input.biography,
      philosophy: input.philosophy,
    } satisfies TablesInsert<"coaches">)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapCoach(data as Coach & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function updateCoach(
  id: string,
  input: CoachFormFields,
): Promise<{ data: CoachWithPerson | null; error: string | null }> {
  const existing = await getCoach(id);
  if (existing.error) return { data: null, error: existing.error };
  if (!existing.data) return { data: null, error: "Coach not found." };

  const { error: personError } = await updatePerson(existing.data.person_id, {
    first_name: input.first_name,
    last_name: input.second_name,
    phone: input.phone,
    email: input.email,
  });
  if (personError) return { data: null, error: personError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .update({
      joined_date: input.joined_date,
      date_of_birth: input.date_of_birth,
      dbs_checked: input.dbs_checked,
      fa_level_1: input.fa_level_1,
      fa_level_2: input.fa_level_2,
      notes: input.notes,
      biography: input.biography,
      philosophy: input.philosophy,
    } satisfies TablesUpdate<"coaches">)
    .eq("id", id)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapCoach(data as Coach & { person: Person | Person[] | null }),
    error: null,
  };
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
    .select(
      `id, coach_id, role, coach:coaches(person:people!person_id(first_name, last_name))`,
    )
    .eq("team_id", teamId);

  if (error) return { data: [], error: error.message };

  const rows: TeamCoachEntry[] = (data ?? []).map((tc) => {
    const coach = Array.isArray(tc.coach) ? tc.coach[0] : tc.coach;
    const personRaw = coach?.person as
      | { first_name: string; last_name: string }
      | { first_name: string; last_name: string }[]
      | null
      | undefined;
    const person = Array.isArray(personRaw) ? personRaw[0] : personRaw;
    return {
      team_coach_id: tc.id,
      coach_id: tc.coach_id,
      name: person ? `${person.first_name} ${person.last_name}` : "",
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
): Promise<{ data: CoachWithPerson[]; error: string | null }> {
  const supabase = await createClient();
  const [
    { data: coaches, error: coachesError },
    { data: assigned, error: assignedError },
  ] = await Promise.all([
    supabase.from("coaches").select(`*, ${PERSON_EMBED}`).eq("club_id", clubId),
    supabase.from("team_coaches").select("coach_id").eq("team_id", teamId),
  ]);

  if (coachesError) return { data: [], error: coachesError.message };
  if (assignedError) return { data: [], error: assignedError.message };

  const onTeam = new Set((assigned ?? []).map((r) => r.coach_id));
  const mapped = (coaches ?? [])
    .filter((c) => !onTeam.has(c.id))
    .map((c) => mapCoach(c as Coach & { person: Person | Person[] | null }));
  mapped.sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );
  return { data: mapped, error: null };
}
