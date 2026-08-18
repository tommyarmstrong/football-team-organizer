"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  COACH_OBJECTIVE_STATUSES,
  COACH_OBJECTIVE_STATUS_LABELS,
  COACH_OBJECTIVE_TYPES,
  COACH_OBJECTIVE_TYPE_LABELS,
} from "@/lib/constants";
import {
  addCoachObjectiveAction,
  updateCoachObjectiveAction,
} from "@/lib/coaches/actions";
import type { CoachDevelopmentObjective } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function CoachObjectiveForm({
  coachId,
  personId,
  objective,
  mode,
}: {
  coachId: string;
  personId: string;
  objective?: CoachDevelopmentObjective;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? addCoachObjectiveAction.bind(null, coachId)
      : updateCoachObjectiveAction.bind(null, coachId, objective!.id);

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
            placeholder="e.g. Complete FA Level 2 this season"
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
              defaultValue={objective?.objective_type ?? "coaching"}
            >
              {COACH_OBJECTIVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {COACH_OBJECTIVE_TYPE_LABELS[type]}
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
              defaultValue={objective?.status ?? "in_progress"}
            >
              {COACH_OBJECTIVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {COACH_OBJECTIVE_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target date</Label>
            <Input
              id="target_date"
              name="target_date"
              type="date"
              defaultValue={objective?.target_date ?? undefined}
              disabled={pending}
            />
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
