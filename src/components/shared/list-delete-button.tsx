"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { ActionState } from "@/lib/action-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ListDeleteButton({
  label,
  confirmMessage,
  deleteAction,
}: {
  label: string;
  confirmMessage: string;
  deleteAction: () => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(
    async () => deleteAction(),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="shrink-0"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? (
        <div className="sr-only" role="alert">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        title={label}
        className="text-muted-foreground hover:bg-muted hover:text-destructive inline-flex size-9 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2Icon className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
