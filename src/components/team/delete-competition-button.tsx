"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { deleteCompetitionAction } from "@/lib/team/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function DeleteCompetitionButton({
  competitionId,
  competitionName,
  label = "Delete",
}: {
  competitionId: string;
  competitionName: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => deleteCompetitionAction(competitionId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete “${competitionName}”? Matches keep their fixture data; the competition link is cleared.`,
          )
        ) {
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
