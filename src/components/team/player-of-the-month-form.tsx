"use client";

import { useEffect } from "react";
import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createPlayerOfTheMonthAction,
  createPlayerOfTheMonthOnPageAction,
  updatePlayerOfTheMonthAction,
  updatePlayerOfTheMonthOnPageAction,
} from "@/lib/player-of-the-month/actions";
import type { PlayerOfTheMonthWithPlayer } from "@/lib/data/player-of-the-month";
import type { NamedPlayer } from "@/lib/people/named-player";
import { playerDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

function monthInputValue(month: string | null | undefined): string {
  if (!month) return "";
  return month.slice(0, 7);
}

export function PlayerOfTheMonthForm({
  mode,
  award,
  players,
  stayOnPage = false,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  award?: PlayerOfTheMonthWithPlayer;
  players: Array<NamedPlayer & { shirt_number?: number | null }>;
  stayOnPage?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const action = stayOnPage
    ? mode === "create"
      ? createPlayerOfTheMonthOnPageAction
      : updatePlayerOfTheMonthOnPageAction.bind(null, award!.id)
    : mode === "create"
      ? createPlayerOfTheMonthAction
      : updatePlayerOfTheMonthAction.bind(null, award!.id);

  const [state, formAction, pending] = useToastActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="player_id">
            Player <span className="text-muted-foreground">(required)</span>
          </Label>
          <NativeSelect
            id="player_id"
            name="player_id"
            required
            aria-required="true"
            defaultValue={award?.player_id ?? ""}
            disabled={pending}
          >
            <option value="">Select player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number ?? null,
                })}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="month">
            Month <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="month"
            name="month"
            type="month"
            required
            aria-required="true"
            defaultValue={monthInputValue(award?.month)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">
            Notes <OptionalHint />
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={award?.notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      {onCancel || mode === "edit" ? (
        <FormActions
          pending={pending}
          cancelHref={onCancel ? undefined : "/team"}
          onCancel={onCancel}
        />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add player of the month"}
        </Button>
      )}
    </form>
  );
}
