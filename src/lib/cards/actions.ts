"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { CARD_TYPES } from "@/lib/constants";
import { createCard, deleteCard, updateCard } from "@/lib/data/cards";
import { str } from "@/lib/form-parse";
import type { CardType, TablesInsert } from "@/lib/supabase/database.types";

function revalidateCard(matchId: string, cardId?: string) {
  revalidatePath(`/matches/${matchId}`);
  if (cardId) {
    revalidatePath(`/matches/${matchId}/cards/${cardId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

function parsePlayerId(formData: FormData): string | { error: string } {
  const player_id = str(formData, "player_id");
  if (!player_id) {
    return { error: "Select a player." };
  }
  return player_id;
}

function parseCardType(formData: FormData): CardType | { error: string } {
  const type = str(formData, "type") as CardType;
  if (!CARD_TYPES.includes(type)) {
    return { error: "Select a card type." };
  }
  return type;
}

export async function createCardAction(
  matchId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const player_id = parsePlayerId(formData);
  if (typeof player_id === "object") return player_id;

  const type = parseCardType(formData);
  if (typeof type === "object") return type;

  const input: TablesInsert<"cards"> = {
    match_id: matchId,
    type,
    player_id,
    coach_id: null,
    guardian_id: null,
    coach_notes: str(formData, "coach_notes") || null,
    referee_notes: str(formData, "referee_notes") || null,
    club_notes: str(formData, "club_notes") || null,
  };

  const { data, error } = await createCard(input);
  if (error) return { error };
  if (!data) return { error: "Could not create card." };

  revalidateCard(matchId, data.id);
  redirect(`/matches/${matchId}/cards/${data.id}`);
}

export async function saveCardAndReturnToMatchAction(
  matchId: string,
  cardId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const type = parseCardType(formData);
  if (typeof type === "object") return type;

  const player_id = parsePlayerId(formData);
  if (typeof player_id === "object") return player_id;

  const { error } = await updateCard(cardId, {
    type,
    player_id,
    coach_id: null,
    guardian_id: null,
    coach_notes: str(formData, "coach_notes") || null,
    referee_notes: str(formData, "referee_notes") || null,
    club_notes: str(formData, "club_notes") || null,
  });

  if (error) return { error };

  revalidateCard(matchId, cardId);
  redirect(`/matches/${matchId}`);
}

export async function deleteCardAction(
  matchId: string,
  cardId: string,
): Promise<ActionState> {
  const { error } = await deleteCard(cardId);
  if (error) return { error };

  revalidateCard(matchId);
  return {};
}

export async function deleteCardAndReturnToMatchAction(
  matchId: string,
  cardId: string,
): Promise<ActionState> {
  const result = await deleteCardAction(matchId, cardId);
  if (result.error) return result;
  redirect(`/matches/${matchId}`);
}
