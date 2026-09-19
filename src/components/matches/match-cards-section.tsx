"use client";

import Link from "next/link";
import { deleteCardAction } from "@/lib/cards/actions";
import { CARD_TYPE_EMOJIS } from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import type { RosterPlayer } from "@/lib/data/players";
import {
  coachDisplayName,
  guardianDisplayName,
  playerDisplayName,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineFormDialog } from "@/components/shared/inline-form-dialog";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { MatchCardEditSection } from "@/components/matches/match-card-edit-section";

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
}

export function MatchCardsSection({
  matchId,
  cards,
  players = [],
  canEdit = true,
}: {
  matchId: string;
  cards: CardWithPerson[];
  players?: RosterPlayer[];
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
              {canEdit ? (
                <InlineFormDialog
                  title="Edit card"
                  description="Update the player, type, and notes. Save keeps you on this match."
                  trigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className={objectListRowClassName()}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium">
                        <span aria-hidden="true">
                          {CARD_TYPE_EMOJIS[card.type]}
                        </span>
                        <span className="truncate">
                          {cardPersonLabel(card)}
                        </span>
                      </span>
                    </button>
                  )}
                >
                  {(close) => (
                    <MatchCardEditSection
                      matchId={matchId}
                      card={card}
                      players={players}
                      canEdit
                      stayOnPage
                      onSuccess={close}
                      onCancel={close}
                    />
                  )}
                </InlineFormDialog>
              ) : (
                <Link
                  href={`/matches/${matchId}/cards/${card.id}`}
                  className={objectListRowClassName()}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium">
                    <span aria-hidden="true">
                      {CARD_TYPE_EMOJIS[card.type]}
                    </span>
                    <span className="truncate">{cardPersonLabel(card)}</span>
                  </span>
                </Link>
              )}
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
        <InlineFormDialog
          title="Add card"
          description="Choose the player and card type. Save keeps you on this match."
          trigger={(open) => (
            <Button type="button" onClick={open}>
              Add
            </Button>
          )}
        >
          {(close) => (
            <MatchCardEditSection
              matchId={matchId}
              players={players}
              canEdit
              stayOnPage
              onSuccess={close}
              onCancel={close}
            />
          )}
        </InlineFormDialog>
      ) : null}
    </div>
  );
}
