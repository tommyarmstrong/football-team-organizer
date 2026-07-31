import { createClient } from "@/lib/supabase/server";
import {
  PERSON_EMBED,
  withPersonFields,
  type PersonFields,
} from "@/lib/people/person";
import { createPerson, updatePerson } from "@/lib/data/people";
import type {
  Manager,
  Person,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type ManagerWithPerson = Manager & PersonFields;

export type { Manager };

function mapManager(
  row: Manager & { person: Person | Person[] | null },
): ManagerWithPerson {
  return withPersonFields(row);
}

export async function listManagers(
  clubId?: string,
): Promise<{ data: ManagerWithPerson[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("managers")
    .select(`*, ${PERSON_EMBED}`)
    .order("created_at", { ascending: true });

  if (clubId) query = query.eq("club_id", clubId);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };

  const mapped = (data ?? []).map((row) =>
    mapManager(row as Manager & { person: Person | Person[] | null }),
  );
  mapped.sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name),
  );
  return { data: mapped, error: null };
}

export async function getManager(
  id: string,
): Promise<{ data: ManagerWithPerson | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .select(`*, ${PERSON_EMBED}`)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: mapManager(data as Manager & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function createManager(input: {
  club_id: string;
  first_name: string;
  second_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  person_id?: string;
}): Promise<{ data: ManagerWithPerson | null; error: string | null }> {
  let personId = input.person_id;
  if (!personId) {
    const { data: person, error: personError } = await createPerson({
      first_name: input.first_name,
      last_name: input.second_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      account_status: "none",
    });
    if (personError) return { data: null, error: personError };
    if (!person) return { data: null, error: "Could not create person." };
    personId = person.id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .insert({
      club_id: input.club_id,
      person_id: personId,
      notes: input.notes ?? null,
    } satisfies TablesInsert<"managers">)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapManager(data as Manager & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function updateManager(
  id: string,
  input: {
    first_name: string;
    second_name: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  },
): Promise<{ data: ManagerWithPerson | null; error: string | null }> {
  const existing = await getManager(id);
  if (existing.error) return { data: null, error: existing.error };
  if (!existing.data) return { data: null, error: "Manager not found." };

  const { error: personError } = await updatePerson(existing.data.person_id, {
    first_name: input.first_name,
    last_name: input.second_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
  });
  if (personError) return { data: null, error: personError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .update({ notes: input.notes ?? null } satisfies TablesUpdate<"managers">)
    .eq("id", id)
    .select(`*, ${PERSON_EMBED}`)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: mapManager(data as Manager & { person: Person | Person[] | null }),
    error: null,
  };
}

export async function deleteManager(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("managers").delete().eq("id", id);
  return { error: error?.message ?? null };
}
