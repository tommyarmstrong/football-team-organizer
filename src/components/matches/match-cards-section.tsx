"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createCardAction,
  deleteCardAction,
  updateCardAction,
} from "@/lib/cards/actions";
import { CARD_TYPE_LABELS, CARD_TYPES } from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import type { RosterPlayer } from "@/lib/data/players";
import {
  coachDisplayName,
  guardianDisplayName,
  labelCardType,
  playerDisplayName,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

function cardPlayerId(card: CardWithPerson): string {
  return card.player_id ?? "";
}

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
  if (!canEdit) {
    return cards.length === 0 ? (
      <EmptyState
        title="No cards recorded"
        description="Cards issued during this match will appear here."
      />
    ) : (
      <ul className="divide-border border-border divide-y rounded-xl border">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="font-medium">{cardPersonLabel(card)}</span>
            <span className="text-muted-foreground">
              {labelCardType(card.type)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AddCardForm matchId={matchId} players={players} />

      {cards.length === 0 ? (
        <EmptyState
          title="No cards recorded"
          description="Add yellow cards, red cards, timeouts, or other cards for a player."
        />
      ) : (
        <ul className="space-y-4">
          {cards.map((card) => (
            <li key={card.id} className="border-border rounded-xl border p-4">
              <CardRow matchId={matchId} card={card} players={players} />
            </li>
          ))}
        </ul>
      )}
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

  if (players.length === 0) {
    return (
      <EmptyState
        title="No players available"
        description="Add players before recording cards."
      />
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border space-y-3 rounded-xl border p-4"
    >
      <p className="text-sm font-medium">Add card</p>
      <CardFields players={players} pending={pending} />
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add card"}
      </Button>
    </form>
  );
}

function CardRow({
  matchId,
  card,
  players,
}: {
  matchId: string;
  card: CardWithPerson;
  players: RosterPlayer[];
}) {
  const boundUpdate = updateCardAction.bind(null, matchId, card.id);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async () => deleteCardAction(matchId, card.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <CardFields
          players={players}
          pending={pending}
          defaults={{
            player_id: cardPlayerId(card),
            type: card.type,
            coach_notes: card.coach_notes,
            referee_notes: card.referee_notes,
            club_notes: card.club_notes,
          }}
        />
        {state.error ? <ErrorBanner message={state.error} /> : null}
        {state.success ? (
          <p className="text-muted-foreground text-sm" role="status">
            {state.success}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
      <form
        action={deleteAction}
        className="space-y-2"
        onSubmit={(event) => {
          if (!window.confirm("Remove this card?")) {
            event.preventDefault();
          }
        }}
      >
        {deleteState.error ? <ErrorBanner message={deleteState.error} /> : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={deletePending}
        >
          {deletePending ? "Removing…" : "Remove card"}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Current: {cardPersonLabel(card)} · {labelCardType(card.type)}
      </p>
    </div>
  );
}

function CardFields({
  players,
  pending,
  defaults,
}: {
  players: RosterPlayer[];
  pending: boolean;
  defaults?: {
    player_id?: string;
    type?: string;
    coach_notes?: string | null;
    referee_notes?: string | null;
    club_notes?: string | null;
  };
}) {
  const fieldKey = defaults?.player_id ?? "new";
  const activePlayers = players.filter((p) => p.active);
  const playerOptions = activePlayers.length > 0 ? activePlayers : players;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`player_id-${fieldKey}`}>
          Player <span className="text-muted-foreground">(required)</span>
        </Label>
        <NativeSelect
          id={`player_id-${fieldKey}`}
          name="player_id"
          required
          aria-required="true"
          defaultValue={defaults?.player_id ?? ""}
          disabled={pending}
        >
          <option value="" disabled>
            Select player
          </option>
          {playerOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {playerDisplayName(p, { shirtNumber: p.shirt_number })}
              {!p.active ? " (inactive)" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`type-${fieldKey}`}>
          Type <span className="text-muted-foreground">(required)</span>
        </Label>
        <NativeSelect
          id={`type-${fieldKey}`}
          name="type"
          required
          aria-required="true"
          defaultValue={defaults?.type ?? ""}
          disabled={pending}
        >
          <option value="" disabled>
            Select type
          </option>
          {CARD_TYPES.map((type) => (
            <option key={type} value={type}>
              {CARD_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`coach_notes-${fieldKey}`}>Coach notes</Label>
        <Textarea
          id={`coach_notes-${fieldKey}`}
          name="coach_notes"
          rows={2}
          defaultValue={defaults?.coach_notes ?? ""}
          disabled={pending}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`referee_notes-${fieldKey}`}>Referee notes</Label>
        <Textarea
          id={`referee_notes-${fieldKey}`}
          name="referee_notes"
          rows={2}
          defaultValue={defaults?.referee_notes ?? ""}
          disabled={pending}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`club_notes-${fieldKey}`}>Club notes</Label>
        <Textarea
          id={`club_notes-${fieldKey}`}
          name="club_notes"
          rows={2}
          defaultValue={defaults?.club_notes ?? ""}
          disabled={pending}
        />
      </div>
    </div>
  );
}
