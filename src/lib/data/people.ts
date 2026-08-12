import { createClient } from "@/lib/supabase/server";
import type {
  Person,
  PersonInvitation,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import { normalizeEmail } from "@/lib/people/person";

export type { Person, PersonInvitation };

export type PersonRoleRef = {
  id: string;
  club_id: string;
  active_role: boolean;
};

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
  playerIds: string[];
  playerTeamIds: string[];
  linkedPlayerIds: string[];
  linkedPlayerTeamIds: string[];
  emergency_contact: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
};

export async function listPeople(): Promise<{
  data: PersonDirectoryItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      `*,
      managers(id, active_role),
      coaches(id, active_role),
      guardians(id, active_role, player_guardians(player_id)),
      players(
        id,
        active_role,
        team_players(team_id),
        player_guardians(
          emergency_contact,
          guardian:guardians(
            person:people!person_id(first_name, last_name, phone)
          )
        )
      )`,
    )
    .neq("account_status", "disabled")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const playerTeamMap = new Map<string, string[]>();
  const mapped = (data ?? []).map((row) => {
    const person = row as Person & {
      managers: { id: string; active_role: boolean }[] | null;
      coaches: { id: string; active_role: boolean }[] | null;
      guardians:
        | {
            id: string;
            active_role: boolean;
            player_guardians: { player_id: string }[] | null;
          }[]
        | null;
      players:
        | {
            id: string;
            active_role: boolean;
            team_players: { team_id: string }[] | null;
            player_guardians:
              | {
                  emergency_contact: boolean;
                  guardian:
                    | {
                        person:
                          | {
                              first_name: string;
                              last_name: string;
                              phone: string | null;
                            }
                          | {
                              first_name: string;
                              last_name: string;
                              phone: string | null;
                            }[]
                          | null;
                      }
                    | {
                        person:
                          | {
                              first_name: string;
                              last_name: string;
                              phone: string | null;
                            }
                          | {
                              first_name: string;
                              last_name: string;
                              phone: string | null;
                            }[]
                          | null;
                      }[]
                    | null;
                }[]
              | null;
          }[]
        | null;
    };
    const { managers, coaches, guardians, players, ...rest } = person;

    const activePlayers = (players ?? []).filter((r) => r.active_role);
    const playerIds = activePlayers.map((r) => r.id);
    const playerTeamIds = [
      ...new Set(
        activePlayers.flatMap((r) =>
          (r.team_players ?? []).map((tp) => tp.team_id),
        ),
      ),
    ];
    const linkedPlayerIds = [
      ...new Set(
        (guardians ?? [])
          .filter((r) => r.active_role)
          .flatMap((r) =>
            (r.player_guardians ?? []).map((link) => link.player_id),
          ),
      ),
    ];
    for (const player of activePlayers) {
      playerTeamMap.set(
        player.id,
        (player.team_players ?? []).map((tp) => tp.team_id),
      );
    }

    let emergency_contact: PersonDirectoryItem["emergency_contact"] = null;
    for (const player of activePlayers) {
      const link = (player.player_guardians ?? []).find(
        (row) => row.emergency_contact,
      );
      if (!link) continue;
      const guardian = Array.isArray(link.guardian)
        ? link.guardian[0]
        : link.guardian;
      const contactPerson = Array.isArray(guardian?.person)
        ? guardian?.person[0]
        : guardian?.person;
      if (!contactPerson) continue;
      emergency_contact = {
        first_name: contactPerson.first_name,
        last_name: contactPerson.last_name,
        phone: contactPerson.phone,
      };
      break;
    }

    return {
      ...rest,
      roles: {
        player: activePlayers.length > 0,
        guardian: (guardians ?? []).some((r) => r.active_role),
        coach: (coaches ?? []).some((r) => r.active_role),
        manager: (managers ?? []).some((r) => r.active_role),
      },
      playerIds,
      playerTeamIds,
      linkedPlayerIds,
      linkedPlayerTeamIds: [] as string[],
      emergency_contact,
    };
  });

  const rows: PersonDirectoryItem[] = mapped.map((person) => ({
    ...person,
    linkedPlayerTeamIds: [
      ...new Set(
        person.linkedPlayerIds.flatMap(
          (playerId) => playerTeamMap.get(playerId) ?? [],
        ),
      ),
    ],
  }));

  return { data: rows, error: null };
}

export async function getPerson(
  id: string,
): Promise<{ data: PersonWithRoles | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      "*, managers(id, club_id, active_role), coaches(id, club_id, active_role), guardians(id, club_id, active_role), players(id, club_id, active_role, position, school, date_of_birth)",
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

/**
 * Soft-delete a person: deactivate all roles, revoke open invites, and mark
 * account_status disabled so they leave the directory while historic links stay.
 */
export async function deletePerson(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: person, error: loadError } = await getPerson(id);
  if (loadError) return { error: loadError };
  if (!person) return { error: "Person not found." };

  for (const row of person.players) {
    if (!row.active_role) continue;
    const { error } = await supabase
      .from("players")
      .update({ active_role: false })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }
  for (const row of person.coaches) {
    if (!row.active_role) continue;
    const { error } = await supabase
      .from("coaches")
      .update({ active_role: false })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }
  for (const row of person.guardians) {
    if (!row.active_role) continue;
    const { error } = await supabase
      .from("guardians")
      .update({ active_role: false })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }
  for (const row of person.managers) {
    if (!row.active_role) continue;
    const { error } = await supabase
      .from("managers")
      .update({ active_role: false })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }

  const { error: inviteError } = await supabase
    .from("person_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("person_id", id)
    .is("accepted_at", null)
    .is("revoked_at", null);
  if (inviteError) return { error: inviteError.message };

  const { error } = await supabase
    .from("people")
    .update({ account_status: "disabled" })
    .eq("id", id);
  return { error: error?.message ?? null };
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
