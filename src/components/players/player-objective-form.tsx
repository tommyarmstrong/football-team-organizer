"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  PLAYER_OBJECTIVE_STATUSES,
  PLAYER_OBJECTIVE_STATUS_LABELS,
  PLAYER_OBJECTIVE_TYPES,
  PLAYER_OBJECTIVE_TYPE_LABELS,
} from "@/lib/constants";
import {
  addPlayerObjectiveAction,
  updatePlayerObjectiveAction,
} from "@/lib/players/actions";
import type { PlayerDevelopmentObjective } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function PlayerObjectiveForm({
  playerId,
  personId,
  objective,
  mode,
}: {
  playerId: string;
  personId: string;
  objective?: PlayerDevelopmentObjective;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? addPlayerObjectiveAction.bind(null, playerId)
      : updatePlayerObjectiveAction.bind(null, playerId, objective!.id);

  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="body">
            Objective <span className="text-muted-foreground">(required)</span>
          </Label>
          <Textarea
            id="body"
            name="body"
            rows={3}
            required
            aria-required="true"
            defaultValue={objective?.body}
            disabled={pending}
            placeholder="e.g. Keep the ball under close control when dribbling"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="objective_type">
              Type <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id="objective_type"
              name="objective_type"
              required
              disabled={pending}
              defaultValue={objective?.objective_type ?? "skills"}
            >
              {PLAYER_OBJECTIVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PLAYER_OBJECTIVE_TYPE_LABELS[type]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id="status"
              name="status"
              required
              disabled={pending}
              defaultValue={objective?.status ?? "emerging"}
            >
              {PLAYER_OBJECTIVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PLAYER_OBJECTIVE_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {mode === "edit" ? (
          <FormActions pending={pending} cancelHref={`/people/${personId}`} />
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add objective"}
          </Button>
        )}
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>
    </div>
  );
}
