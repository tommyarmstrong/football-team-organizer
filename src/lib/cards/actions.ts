"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { CARD_TYPES } from "@/lib/constants";
import { createCard, deleteCard, updateCard } from "@/lib/data/cards";
import { str } from "@/lib/form-parse";
import type { CardType, TablesInsert } from "@/lib/supabase/database.types";

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
  const type = parseCardType(formData);
  if (typeof type === "object") return type;

  const player_id = parsePlayerId(formData);
  if (typeof player_id === "object") return player_id;

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

  const { error } = await createCard(input);
  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  return { success: "Card added." };
}

export async function updateCardAction(
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

  revalidatePath(`/matches/${matchId}`);
  return { success: "Card updated." };
}

export async function deleteCardAction(
  matchId: string,
  cardId: string,
): Promise<ActionState> {
  const { error } = await deleteCard(cardId);
  if (error) return { error };

  revalidatePath(`/matches/${matchId}`);
  return { success: "Card removed." };
}
