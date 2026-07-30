import { createClient } from "@/lib/supabase/server";
import { matchAllowsEvents } from "@/lib/constants";
import type {
  Card,
  Coach,
  Guardian,
  Player,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type CardWithPerson = Card & {
  player: Pick<Player, "id" | "first_name" | "last_name"> | null;
  coach: Pick<Coach, "id" | "first_name" | "second_name"> | null;
  guardian: Pick<Guardian, "id" | "first_name" | "second_name"> | null;
};

export async function listCardsForMatch(
  matchId: string,
): Promise<{ data: CardWithPerson[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(
      "*, player:players!cards_player_id_fkey(id, first_name, last_name), coach:coaches!cards_coach_id_fkey(id, first_name, second_name), guardian:guardians!cards_guardian_id_fkey(id, first_name, second_name)",
    )
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []).map((row) => {
    const player = Array.isArray(row.player) ? row.player[0] : row.player;
    const coach = Array.isArray(row.coach) ? row.coach[0] : row.coach;
    const guardian = Array.isArray(row.guardian)
      ? row.guardian[0]
      : row.guardian;
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
      player: player ?? null,
      coach: coach ?? null,
      guardian: guardian ?? null,
    };
  });

  return { data: rows, error: null };
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
