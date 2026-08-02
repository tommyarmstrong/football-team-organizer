import { createClient } from "@/lib/supabase/server";
import type {
  Person,
  PersonInvitation,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import { normalizeEmail } from "@/lib/people/person";

export type { Person, PersonInvitation };

export type PersonRoleRef = { id: string; club_id: string };

export type PersonPlayerRef = PersonRoleRef & {
  position: string | null;
  school: string | null;
  date_of_birth: string | null;
};

export type PersonWithRoles = Person & {
  managers: PersonRoleRef[];
  coaches: PersonRoleRef[];
  guardians: PersonRoleRef[];
  players: PersonPlayerRef[];
  outstanding_invitation: PersonInvitation | null;
};

export type PersonDirectoryItem = Person & {
  roles: {
    player: boolean;
    guardian: boolean;
    coach: boolean;
    manager: boolean;
  };
};

export async function listPeople(): Promise<{
  data: PersonDirectoryItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*, managers(id), coaches(id), guardians(id), players(id)")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows: PersonDirectoryItem[] = (data ?? []).map((row) => {
    const person = row as Person & {
      managers: { id: string }[] | null;
      coaches: { id: string }[] | null;
      guardians: { id: string }[] | null;
      players: { id: string }[] | null;
    };
    const { managers, coaches, guardians, players, ...rest } = person;
    return {
      ...rest,
      roles: {
        player: (players?.length ?? 0) > 0,
        guardian: (guardians?.length ?? 0) > 0,
        coach: (coaches?.length ?? 0) > 0,
        manager: (managers?.length ?? 0) > 0,
      },
    };
  });

  return { data: rows, error: null };
}

export async function getPerson(
  id: string,
): Promise<{ data: PersonWithRoles | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      "*, managers(id, club_id), coaches(id, club_id), guardians(id, club_id), players(id, club_id, position, school, date_of_birth)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const { data: invites } = await supabase
    .from("person_invitations")
    .select("*")
    .eq("person_id", id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = data as Person & {
    managers: PersonRoleRef[];
    coaches: PersonRoleRef[];
    guardians: PersonRoleRef[];
    players: PersonPlayerRef[];
  };

  return {
    data: {
      ...row,
      outstanding_invitation:
        (invites?.[0] as PersonInvitation | undefined) ?? null,
    },
    error: null,
  };
}

export async function createPerson(
  input: TablesInsert<"people">,
): Promise<{ data: Person | null; error: string | null }> {
  const supabase = await createClient();
  const payload = {
    ...input,
    email: input.email ? normalizeEmail(input.email) : null,
  };
  const { data, error } = await supabase
    .from("people")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("people_email_lower_uidx")) {
      return { data: null, error: "A person with that email already exists." };
    }
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function updatePerson(
  id: string,
  input: TablesUpdate<"people">,
): Promise<{ data: Person | null; error: string | null }> {
  const supabase = await createClient();
  const payload = {
    ...input,
    ...(input.email !== undefined
      ? { email: input.email ? normalizeEmail(input.email) : null }
      : {}),
  };
  const { data, error } = await supabase
    .from("people")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("people_email_lower_uidx")) {
      return { data: null, error: "A person with that email already exists." };
    }
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function linkRoleToPerson(input: {
  personId: string;
  role: "manager" | "coach" | "guardian" | "player";
  roleId: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const table =
    input.role === "manager"
      ? "managers"
      : input.role === "coach"
        ? "coaches"
        : input.role === "guardian"
          ? "guardians"
          : "players";

  const { error } = await supabase
    .from(table)
    .update({ person_id: input.personId })
    .eq("id", input.roleId);

  return { error: error?.message ?? null };
}

export async function getPersonByAuthUserId(
  authUserId: string,
): Promise<{ data: Person | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
