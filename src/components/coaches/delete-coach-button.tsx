"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deleteCoachAction } from "@/lib/coaches/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeleteCoachButton({ coachId }: { coachId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => deleteCoachAction(coachId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Delete this coach? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : "Delete coach"}
      </Button>
    </form>
  );
}
