"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { createCardAction, deleteCardAction } from "@/lib/cards/actions";
import {
  CARD_TYPE_EMOJIS,
  CARD_TYPE_LABELS,
  CARD_TYPES,
} from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import type { RosterPlayer } from "@/lib/data/players";
import {
  coachDisplayName,
  guardianDisplayName,
  playerDisplayName,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
}

export function MatchCardsSection({
  matchId,
  cards,
  players,
  canEdit = true,
}: {
  matchId: string;
  cards: CardWithPerson[];
  players: RosterPlayer[];
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
          description="Add a player and card type below. Open a card to edit notes."
        />
      ) : (
        <ul className={objectListClassName}>
          {cards.map((card) => (
            <li key={card.id} className="flex items-stretch">
              <Link
                href={`/matches/${matchId}/cards/${card.id}`}
                className={objectListRowClassName()}
              >
                <span className="border-border bg-background inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium">
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

      {canEdit ? <AddCardForm matchId={matchId} players={players} /> : null}
    </div>
  );
}

function AddCardForm({
  matchId,
  players,
}: {
  matchId: string;
  players: RosterPlayer[];
}) {
  const bound = createCardAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const activePlayers = players.filter((p) => p.active);
  const playerOptions = activePlayers.length > 0 ? activePlayers : players;

  if (playerOptions.length === 0) {
    return (
      <EmptyState
        title="No players available"
        description="Select the match-day squad before recording cards."
      />
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="add-card-player">Add card</Label>
        <SearchableSelect
          id="add-card-player"
          name="player_id"
          required
          disabled={pending}
          placeholder="Search players by name…"
          emptyMessage="No players match that name."
          options={playerOptions.map((player) => ({
            value: player.id,
            label: `${playerDisplayName(player, {
              shirtNumber: player.shirt_number,
            })}${!player.active ? " (inactive)" : ""}`,
          }))}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="add-card-type">Type</Label>
        <NativeSelect
          id="add-card-type"
          name="type"
          required
          disabled={pending}
          defaultValue="yellow_1st"
        >
          {CARD_TYPES.map((type) => (
            <option key={type} value={type}>
              {CARD_TYPE_EMOJIS[type]} {CARD_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
