"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createCardAction,
  deleteCardAction,
  updateCardAction,
} from "@/lib/cards/actions";
import {
  CARD_PERSON_KIND_LABELS,
  CARD_PERSON_KINDS,
  CARD_TYPE_LABELS,
  CARD_TYPES,
  type CardPersonKind,
} from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import type { Guardian } from "@/lib/data/guardians";
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

function cardPersonKind(card: CardWithPerson): CardPersonKind {
  if (card.coach_id) return "coach";
  if (card.guardian_id) return "guardian";
  return "player";
}

function cardPersonId(card: CardWithPerson): string {
  return card.player_id ?? card.coach_id ?? card.guardian_id ?? "";
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
  coaches,
  guardians,
  canEdit = true,
}: {
  matchId: string;
  cards: CardWithPerson[];
  players: RosterPlayer[];
  coaches: TeamCoachEntry[];
  guardians: Guardian[];
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
              {labelCardType(card.type)} ·{" "}
              {CARD_PERSON_KIND_LABELS[cardPersonKind(card)]}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AddCardForm
        matchId={matchId}
        players={players}
        coaches={coaches}
        guardians={guardians}
      />

      {cards.length === 0 ? (
        <EmptyState
          title="No cards recorded"
          description="Add yellow cards, red cards, timeouts, or other cards for a player, coach, or guardian."
        />
      ) : (
        <ul className="space-y-4">
          {cards.map((card) => (
            <li key={card.id} className="border-border rounded-xl border p-4">
              <CardRow
                matchId={matchId}
                card={card}
                players={players}
                coaches={coaches}
                guardians={guardians}
              />
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
  coaches,
  guardians,
}: {
  matchId: string;
  players: RosterPlayer[];
  coaches: TeamCoachEntry[];
  guardians: Guardian[];
}) {
  const bound = createCardAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const hasAnyone =
    players.length > 0 || coaches.length > 0 || guardians.length > 0;

  if (!hasAnyone) {
    return (
      <EmptyState
        title="No people available"
        description="Add players, coaches, or guardians before recording cards."
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
      <CardFields
        players={players}
        coaches={coaches}
        guardians={guardians}
        pending={pending}
      />
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
  coaches,
  guardians,
}: {
  matchId: string;
  card: CardWithPerson;
  players: RosterPlayer[];
  coaches: TeamCoachEntry[];
  guardians: Guardian[];
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
          coaches={coaches}
          guardians={guardians}
          pending={pending}
          defaults={{
            person_kind: cardPersonKind(card),
            person_id: cardPersonId(card),
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
  coaches,
  guardians,
  pending,
  defaults,
}: {
  players: RosterPlayer[];
  coaches: TeamCoachEntry[];
  guardians: Guardian[];
  pending: boolean;
  defaults?: {
    person_kind?: CardPersonKind;
    person_id?: string;
    type?: string;
    coach_notes?: string | null;
    referee_notes?: string | null;
    club_notes?: string | null;
  };
}) {
  const defaultKind =
    defaults?.person_kind ??
    (players.length > 0 ? "player" : coaches.length > 0 ? "coach" : "guardian");
  const [personKind, setPersonKind] = useState<CardPersonKind>(defaultKind);
  const fieldKey = defaults?.person_id ?? "new";

  const activePlayers = players.filter((p) => p.active);
  const playerOptions = activePlayers.length > 0 ? activePlayers : players;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`person_kind-${fieldKey}`}>
          Person type <span className="text-muted-foreground">(required)</span>
        </Label>
        <NativeSelect
          id={`person_kind-${fieldKey}`}
          name="person_kind"
          required
          aria-required="true"
          value={personKind}
          disabled={pending}
          onChange={(event) =>
            setPersonKind(event.target.value as CardPersonKind)
          }
        >
          {CARD_PERSON_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {CARD_PERSON_KIND_LABELS[kind]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`person_id-${fieldKey}`}>
          Person <span className="text-muted-foreground">(required)</span>
        </Label>
        <NativeSelect
          key={`${personKind}-${fieldKey}`}
          id={`person_id-${fieldKey}`}
          name="person_id"
          required
          aria-required="true"
          defaultValue={
            personKind === defaults?.person_kind
              ? (defaults.person_id ?? "")
              : ""
          }
          disabled={pending}
        >
          <option value="" disabled>
            Select {CARD_PERSON_KIND_LABELS[personKind].toLowerCase()}
          </option>
          {personKind === "player"
            ? playerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerDisplayName(p, { shirtNumber: p.shirt_number })}
                  {!p.active ? " (inactive)" : ""}
                </option>
              ))
            : null}
          {personKind === "coach"
            ? coaches.map((c) => (
                <option key={c.coach_id} value={c.coach_id}>
                  {c.name}
                  {c.role ? ` (${c.role})` : ""}
                </option>
              ))
            : null}
          {personKind === "guardian"
            ? guardians.map((g) => (
                <option key={g.id} value={g.id}>
                  {guardianDisplayName(g)}
                </option>
              ))
            : null}
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
