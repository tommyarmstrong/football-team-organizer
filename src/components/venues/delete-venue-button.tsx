"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deleteVenueAction } from "@/lib/venues/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeleteVenueButton({
  venueId,
  label = "Delete venue",
}: {
  venueId: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => deleteVenueAction(venueId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Delete this venue? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : label}
      </Button>
    </form>
  );
}
