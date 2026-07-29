"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deleteGuardianAction } from "@/lib/guardians/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeleteGuardianButton({ guardianId }: { guardianId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => deleteGuardianAction(guardianId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this guardian? Player links will be removed. This cannot be undone.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : "Delete guardian"}
      </Button>
    </form>
  );
}
