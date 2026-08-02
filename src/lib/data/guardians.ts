import { createClient } from "@/lib/supabase/server";
import { createPerson, updatePerson } from "@/lib/data/people";
import {
  PERSON_EMBED,
  unwrapPerson,
  unwrapPersonName,
  withPersonFields,
  type PersonFields,
} from "@/lib/people/person";
import type {
  Guardian,
  GuardianRelationship,
  Person,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { GuardianFormFields } from "@/lib/guardians/parse";

export type GuardianWithPerson = Guardian & PersonFields;
export type { Guardian };

export type GuardianPlayerLink = {
  player_guardian_id: string;
  player_id: string;
  player_person_id: string;
  player_first_name: string;
  player_last_name: string;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
};

export type GuardianWithPlayers = GuardianWithPerson & {
  players: GuardianPlayerLink[];
};

function mapGuardian(
  row: Guardian & { person: Person | Person[] | null },
): GuardianWithPerson {
  return withPersonFields(row);
}

export async function listGuardians(): Promise<{
  data: GuardianWithPlayers[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .select(
      `*, ${PERSON_EMBED}, player_guardians(id, player_id, relationship, legal_guardian, player:players(person_id, person:people!person_id(first_name, last_name)))`,
    )
    .eq("active_role", true);

  if (error) return { data: [], error: error.message };

  const rows: GuardianWithPlayers[] = (data ?? []).map((row) => {
    const { player_guardians, ...guardian } = row as Guardian & {
      person: Person | Person[] | null;
      player_guardians: Array<{
        id: string;
        player_id: string;
        relationship: GuardianRelationship;
        legal_guardian: boolean;
        player:
          | {
              person_id: string;
              person:
                | { first_name: string; last_name: string }
                | { first_name: string; last_name: string }[]
                | null;
            }
          | {
              person_id: string;
              person:
                | { first_name: string; last_name: string }
                | { first_name: string; last_name: string }[]
                | null;
            }[]
          | null;
      }>;
    };
    const players: GuardianPlayerLink[] = (player_guardians ?? []).map((pg) => {
      const player = Array.isArray(pg.player) ? pg.player[0] : pg.player;
      const person = unwrapPersonName(player?.person ?? null);
      return {
        player_guardian_id: pg.id,
        player_id: pg.player_id,
        player_person_id: player?.person_id ?? "",
        player_first_name: person?.first_name ?? "",
        player_last_name: person?.last_name ?? "",
        relationship: pg.relationship,
        legal_guardian: pg.legal_guardian,
      };
    });
    return { ...mapGuardian(guardian), players };
  });

  rows.sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );

  return { data: rows, error: null };
}

export async function getGuardian(
  id: string,
): Promise<{ data: GuardianWithPerson | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .select(`*, ${PERSON_EMBED}`)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: mapGuardian(data as Guardian & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function getGuardianPlayers(
  guardianId: string,
): Promise<{ data: GuardianPlayerLink[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_guardians")
    .select(
      "id, player_id, relationship, legal_guardian, player:players(person_id, person:people!person_id(first_name, last_name))",
    )
    .eq("guardian_id", guardianId);

  if (error) return { data: [], error: error.message };

  const rows: GuardianPlayerLink[] = (data ?? []).map((pg) => {
    const player = Array.isArray(pg.player) ? pg.player[0] : pg.player;
    const person = unwrapPersonName(
      (
        player as {
          person?:
            | { first_name: string; last_name: string }
            | { first_name: string; last_name: string }[]
            | null;
        } | null
      )?.person ?? null,
    );
    return {
      player_guardian_id: pg.id,
      player_id: pg.player_id,
      player_person_id:
        (player as { person_id?: string } | null)?.person_id ?? "",
      player_first_name: person?.first_name ?? "",
      player_last_name: person?.last_name ?? "",
      relationship: pg.relationship as GuardianRelationship,
      legal_guardian: pg.legal_guardian,
    };
  });

  return { data: rows, error: null };
}

export type PlayerGuardianLink = {
  player_guardian_id: string;
  guardian_id: string;
  guardian_person_id: string;
  first_name: string;
  second_name: string;
  phone: string | null;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
};

export async function getPlayerGuardians(
  playerId: string,
): Promise<{ data: PlayerGuardianLink[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_guardians")
    .select(
      `id, guardian_id, relationship, legal_guardian, guardian:guardians(person_id, ${PERSON_EMBED})`,
    )
    .eq("player_id", playerId);

  if (error) return { data: [], error: error.message };

  const rows: PlayerGuardianLink[] = (data ?? []).map((pg) => {
    const guardian = Array.isArray(pg.guardian) ? pg.guardian[0] : pg.guardian;
    const person = unwrapPerson(
      (guardian as { person?: Person | Person[] | null } | null)?.person ??
        null,
    );
    return {
      player_guardian_id: pg.id,
      guardian_id: pg.guardian_id,
      guardian_person_id:
        (guardian as { person_id?: string } | null)?.person_id ??
        person?.id ??
        "",
      first_name: person?.first_name ?? "",
      second_name: person?.last_name ?? "",
      phone: person?.phone ?? null,
      relationship: pg.relationship as GuardianRelationship,
      legal_guardian: pg.legal_guardian,
    };
  });

  return { data: rows, error: null };
}

export async function createGuardian(
  input: GuardianFormFields & { club_id: string; person_id?: string },
): Promise<{ data: GuardianWithPerson | null; error: string | null }> {
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
    .from("guardians")
    .insert({
      club_id: input.club_id,
      person_id: personId,
      notes: input.notes,
    } satisfies TablesInsert<"guardians">)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapGuardian(data as Guardian & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function updateGuardian(
  id: string,
  input: GuardianFormFields,
): Promise<{ data: GuardianWithPerson | null; error: string | null }> {
  const existing = await getGuardian(id);
  if (existing.error) return { data: null, error: existing.error };
  if (!existing.data) return { data: null, error: "Guardian not found." };

  const { error: personError } = await updatePerson(existing.data.person_id, {
    first_name: input.first_name,
    last_name: input.second_name,
    phone: input.phone,
    email: input.email,
  });
  if (personError) return { data: null, error: personError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .update({ notes: input.notes } satisfies TablesUpdate<"guardians">)
    .eq("id", id)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapGuardian(data as Guardian & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function setGuardianActiveRole(
  id: string,
  activeRole: boolean,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .update({ active_role: activeRole })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteGuardian(
  id: string,
): Promise<{ error: string | null }> {
  return setGuardianActiveRole(id, false);
}

export async function linkGuardianToPlayer(input: {
  guardian_id: string;
  player_id: string;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("player_guardians").insert(input);
  if (error?.message.includes("player_guardians_unique")) {
    return { error: "That player is already linked to this guardian." };
  }
  return { error: error?.message ?? null };
}

export async function updateGuardianPlayerLink(
  id: string,
  input: {
    relationship?: GuardianRelationship;
    legal_guardian?: boolean;
  },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_guardians")
    .update(input)
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function unlinkGuardianFromPlayer(
  playerGuardianId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_guardians")
    .delete()
    .eq("id", playerGuardianId);
  return { error: error?.message ?? null };
}
