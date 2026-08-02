import type { Person } from "@/lib/supabase/database.types";

export type NamedPlayer = {
  id: string;
  person_id: string;
  first_name: string;
  last_name: string;
};

export const PLAYER_NAME_EMBED =
  "id, person_id, person:people!person_id(first_name, last_name)";

export function mapPlayerNameEmbed(
  row:
    | {
        id: string;
        person_id?: string;
        person?:
          | Pick<Person, "first_name" | "last_name">
          | Pick<Person, "first_name" | "last_name">[]
          | null;
      }
    | null
    | undefined,
): NamedPlayer | null {
  if (!row) return null;
  const personRaw = row.person;
  const person = Array.isArray(personRaw) ? personRaw[0] : personRaw;
  return {
    id: row.id,
    person_id: row.person_id ?? "",
    first_name: person?.first_name ?? "",
    last_name: person?.last_name ?? "",
  };
}
