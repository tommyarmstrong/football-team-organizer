"use client";

import Link from "next/link";
import { deleteCardAction } from "@/lib/cards/actions";
import { CARD_TYPE_EMOJIS } from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import {
  coachDisplayName,
  guardianDisplayName,
  playerDisplayName,
} from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
}

export function MatchCardsSection({
  matchId,
  cards,
  canEdit = true,
}: {
  matchId: string;
  cards: CardWithPerson[];
  canEdit?: boolean;
}) {
  if (!canEdit && cards.length === 0) {
    return (
      <EmptyState
        title="No cards recorded"
        description="Cards issued during this match will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <EmptyState
          title="No cards recorded"
          description="Add a card, then set the player and other details."
        />
      ) : (
        <ul className={objectListClassName}>
          {cards.map((card) => (
            <li key={card.id} className="flex items-stretch">
              <Link
                href={`/matches/${matchId}/cards/${card.id}`}
                className={objectListRowClassName()}
              >
                <span className="border-border bg-background inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium">
                  <span aria-hidden="true">{CARD_TYPE_EMOJIS[card.type]}</span>
                  <span className="truncate">{cardPersonLabel(card)}</span>
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListDeleteButton
                    label={`Delete card for ${cardPersonLabel(card)}`}
                    confirmMessage="Remove this card?"
                    deleteAction={() => deleteCardAction(matchId, card.id)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <Link
          href={`/matches/${matchId}/cards/new`}
          className={buttonVariants()}
        >
          Add
        </Link>
      ) : null}
    </div>
  );
}
