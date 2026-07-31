import { createClient } from "@/lib/supabase/server";
import { matchAllowsEvents } from "@/lib/constants";
import { unwrapPerson } from "@/lib/people/person";
import type {
  Card,
  Person,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

type NamedPerson = {
  id: string;
  first_name: string;
  last_name: string;
  second_name?: string;
};

export type CardWithPerson = Card & {
  player: NamedPerson | null;
  coach: NamedPerson | null;
  guardian: NamedPerson | null;
};

const CARD_PERSON_SELECT =
  "*, player:players!cards_player_id_fkey(id, person:people!person_id(first_name, last_name)), coach:coaches!cards_coach_id_fkey(id, person:people!person_id(first_name, last_name)), guardian:guardians!cards_guardian_id_fkey(id, person:people!person_id(first_name, last_name))";

function mapNamedRole(
  row:
    | {
        id: string;
        person?:
          | Person
          | Person[]
          | { first_name: string; last_name: string }
          | { first_name: string; last_name: string }[]
          | null;
      }
    | null
    | undefined,
  useSecondName: boolean,
): NamedPerson | null {
  if (!row) return null;
  const person = unwrapPerson(row.person as Person | Person[] | null);
  if (!person)
    return { id: row.id, first_name: "", last_name: "", second_name: "" };
  return {
    id: row.id,
    first_name: person.first_name,
    last_name: person.last_name,
    second_name: useSecondName ? person.last_name : undefined,
  };
}

function mapCardRow(row: {
  id: string;
  match_id: string;
  player_id: string | null;
  coach_id: string | null;
  guardian_id: string | null;
  type: Card["type"];
  coach_notes: string | null;
  referee_notes: string | null;
  club_notes: string | null;
  created_at: string;
  player: unknown;
  coach: unknown;
  guardian: unknown;
}): CardWithPerson {
  const player = Array.isArray(row.player) ? row.player[0] : row.player;
  const coach = Array.isArray(row.coach) ? row.coach[0] : row.coach;
  const guardian = Array.isArray(row.guardian) ? row.guardian[0] : row.guardian;
  return {
    id: row.id,
    match_id: row.match_id,
    player_id: row.player_id,
    coach_id: row.coach_id,
    guardian_id: row.guardian_id,
    type: row.type,
    coach_notes: row.coach_notes,
    referee_notes: row.referee_notes,
    club_notes: row.club_notes,
    created_at: row.created_at,
    player: mapNamedRole(
      player as {
        id: string;
        person?: Person | Person[] | null;
      } | null,
      false,
    ),
    coach: mapNamedRole(
      coach as {
        id: string;
        person?: Person | Person[] | null;
      } | null,
      true,
    ),
    guardian: mapNamedRole(
      guardian as {
        id: string;
        person?: Person | Person[] | null;
      } | null,
      true,
    ),
  };
}

export async function listCardsForMatch(
  matchId: string,
): Promise<{ data: CardWithPerson[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(CARD_PERSON_SELECT)
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map((row) =>
      mapCardRow(row as Parameters<typeof mapCardRow>[0]),
    ),
    error: null,
  };
}

export async function getCard(
  cardId: string,
): Promise<{ data: CardWithPerson | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(CARD_PERSON_SELECT)
    .eq("id", cardId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return {
    data: mapCardRow(data as Parameters<typeof mapCardRow>[0]),
    error: null,
  };
}

export async function createCard(
  input: TablesInsert<"cards">,
): Promise<{ data: Card | null; error: string | null }> {
  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", input.match_id)
    .maybeSingle();

  if (matchError) return { data: null, error: matchError.message };
  if (!match) return { data: null, error: "Match not found." };
  if (!matchAllowsEvents(match.status)) {
    return {
      data: null,
      error: "Cards can only be added when the match is in progress or played.",
    };
  }

  const { data, error } = await supabase
    .from("cards")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: friendlyCardError(error.message) };
  return { data, error: null };
}

export async function updateCard(
  id: string,
  input: TablesUpdate<"cards">,
): Promise<{ data: Card | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: friendlyCardError(error.message) };
  return { data, error: null };
}

export async function deleteCard(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  return { error: error?.message ?? null };
}

function friendlyCardError(message: string): string {
  if (message.includes("cards_exactly_one_person")) {
    return "Select exactly one player, coach, or guardian.";
  }
  return message;
}
