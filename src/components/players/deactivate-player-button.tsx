"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deactivatePlayerAction } from "@/lib/players/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeactivatePlayerButton({ playerId }: { playerId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => deactivatePlayerAction(playerId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Deactivate this player? They leave the active squad, but goal history is kept.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deactivating…" : "Deactivate player"}
      </Button>
    </form>
  );
}
