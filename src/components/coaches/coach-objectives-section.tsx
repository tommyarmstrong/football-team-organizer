"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addCoachObjectiveAction,
  deleteCoachObjectiveAction,
  updateCoachObjectiveAction,
} from "@/lib/coaches/actions";
import type { CoachDevelopmentObjective } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CoachObjectivesSection({
  coachId,
  objectives,
  canEdit,
}: {
  coachId: string;
  objectives: CoachDevelopmentObjective[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {canEdit ? <AddObjectiveForm coachId={coachId} /> : null}

      {objectives.length === 0 ? (
        <EmptyState
          title="No development objectives"
          description={
            canEdit
              ? "Add zero or more objectives for this coach."
              : "Development objectives will appear here when added."
          }
        />
      ) : (
        <ul className="space-y-4">
          {objectives.map((objective) => (
            <li
              key={objective.id}
              className="border-border rounded-xl border p-4"
            >
              {canEdit ? (
                <EditObjectiveForm coachId={coachId} objective={objective} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{objective.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddObjectiveForm({ coachId }: { coachId: string }) {
  const bound = addCoachObjectiveAction.bind(null, coachId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border space-y-3 rounded-xl border p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="new-objective">Add objective</Label>
        <Textarea
          id="new-objective"
          name="body"
          rows={2}
          required
          disabled={pending}
          placeholder="e.g. Complete FA Level 2 this season"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? <ErrorBanner message={state.error} /> : null}
    </form>
  );
}

function EditObjectiveForm({
  coachId,
  objective,
}: {
  coachId: string;
  objective: CoachDevelopmentObjective;
}) {
  const boundUpdate = updateCoachObjectiveAction.bind(
    null,
    coachId,
    objective.id,
  );
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    async () => deleteCoachObjectiveAction(coachId, objective.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`objective-${objective.id}`}>Objective</Label>
          <Textarea
            id={`objective-${objective.id}`}
            name="body"
            rows={2}
            required
            defaultValue={objective.body}
            disabled={pending}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.error ? <ErrorBanner message={state.error} /> : null}
        {state.success ? (
          <p className="text-muted-foreground text-sm" role="status">
            {state.success}
          </p>
        ) : null}
      </form>
      <form action={deleteAction}>
        {deleteState.error ? <ErrorBanner message={deleteState.error} /> : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={deletePending}
        >
          {deletePending ? "Removing…" : "Remove"}
        </Button>
      </form>
    </div>
  );
}
