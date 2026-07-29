"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  CARD_PERSON_KINDS,
  CARD_TYPES,
  type CardPersonKind,
} from "@/lib/constants";
import { createCard, deleteCard, updateCard } from "@/lib/data/cards";
import { str } from "@/lib/form-parse";
import type { CardType, TablesInsert } from "@/lib/supabase/database.types";

function parsePersonLink(formData: FormData):
  | {
      player_id: string | null;
      coach_id: string | null;
      guardian_id: string | null;
    }
  | { error: string } {
  const person_kind = str(formData, "person_kind") as CardPersonKind;
  const person_id = str(formData, "person_id");

  if (!CARD_PERSON_KINDS.includes(person_kind)) {
    return {
      error: "Select whether this card is for a player, coach, or guardian.",
    };
  }
  if (!person_id) {
    return { error: "Select a person." };
  }

  return {
    player_id: person_kind === "player" ? person_id : null,
    coach_id: person_kind === "coach" ? person_id : null,
    guardian_id: person_kind === "guardian" ? person_id : null,
  };
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

  const person = parsePersonLink(formData);
  if ("error" in person) return person;

  const input: TablesInsert<"cards"> = {
    match_id: matchId,
    type,
    player_id: person.player_id,
    coach_id: person.coach_id,
    guardian_id: person.guardian_id,
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

  const person = parsePersonLink(formData);
  if ("error" in person) return person;

  const { error } = await updateCard(cardId, {
    type,
    player_id: person.player_id,
    coach_id: person.coach_id,
    guardian_id: person.guardian_id,
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
