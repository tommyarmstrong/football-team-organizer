"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  deleteCardAndReturnToMatchAction,
  saveCardAndReturnToMatchAction,
} from "@/lib/cards/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
}

export function MatchCardEditSection({
  matchId,
  card,
  players,
  canEdit = true,
}: {
  matchId: string;
  card: CardWithPerson;
  players: RosterPlayer[];
  canEdit?: boolean;
}) {
  if (!canEdit) {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Player</dt>
          <dd className="font-medium">{cardPersonLabel(card)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">
            <span aria-hidden="true">{CARD_TYPE_EMOJIS[card.type]} </span>
            {CARD_TYPE_LABELS[card.type]}
          </dd>
        </div>
        {card.coach_notes ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Coach notes</dt>
            <dd className="font-medium whitespace-pre-wrap">
              {card.coach_notes}
            </dd>
          </div>
        ) : null}
        {card.referee_notes ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Referee notes</dt>
            <dd className="font-medium whitespace-pre-wrap">
              {card.referee_notes}
            </dd>
          </div>
        ) : null}
        {card.club_notes ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">Club notes</dt>
            <dd className="font-medium whitespace-pre-wrap">
              {card.club_notes}
            </dd>
          </div>
        ) : null}
      </dl>
    );
  }

  return (
    <EditableCardSection matchId={matchId} card={card} players={players} />
  );
}

function EditableCardSection({
  matchId,
  card,
  players,
}: {
  matchId: string;
  card: CardWithPerson;
  players: RosterPlayer[];
}) {
  const formId = `card-details-${card.id}`;
  const bound = saveCardAndReturnToMatchAction.bind(null, matchId, card.id);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const activePlayers = players.filter((p) => p.active);
  const options = activePlayers.length > 0 ? activePlayers : players;
  const optionIds = new Set(options.map((p) => p.id));
  const extra = players.filter(
    (p) => !optionIds.has(p.id) && p.id === card.player_id,
  );
  const playerOptions = [...options, ...extra];

  return (
    <div className="space-y-6">
      <form id={formId} action={formAction} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`player_id-${card.id}`}>
              Player <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id={`player_id-${card.id}`}
              name="player_id"
              required
              disabled={pending}
              defaultValue={card.player_id ?? ""}
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
            <Label htmlFor={`type-${card.id}`}>
              Type <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id={`type-${card.id}`}
              name="type"
              required
              disabled={pending}
              defaultValue={card.type}
            >
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CARD_TYPE_EMOJIS[type]} {CARD_TYPE_LABELS[type]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`coach_notes-${card.id}`}>Coach notes</Label>
            <Textarea
              id={`coach_notes-${card.id}`}
              name="coach_notes"
              rows={2}
              defaultValue={card.coach_notes ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`referee_notes-${card.id}`}>Referee notes</Label>
            <Textarea
              id={`referee_notes-${card.id}`}
              name="referee_notes"
              rows={2}
              defaultValue={card.referee_notes ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`club_notes-${card.id}`}>Club notes</Label>
            <Textarea
              id={`club_notes-${card.id}`}
              name="club_notes"
              rows={2}
              defaultValue={card.club_notes ?? ""}
              disabled={pending}
            />
          </div>
        </div>
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <ListDeleteButton
          label="Remove card"
          confirmMessage="Remove this card?"
          deleteAction={() =>
            deleteCardAndReturnToMatchAction(matchId, card.id)
          }
        />
      </div>
    </div>
  );
}
