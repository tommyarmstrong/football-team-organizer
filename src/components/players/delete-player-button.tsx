"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deletePlayerAction } from "@/lib/players/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeletePlayerButton({ playerId }: { playerId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => deletePlayerAction(playerId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this player from the club? This removes them from all teams. Players with recorded goals cannot be deleted.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : "Delete player"}
      </Button>
    </form>
  );
}
