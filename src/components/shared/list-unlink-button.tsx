"use client";

import { XIcon } from "lucide-react";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { ActionState } from "@/lib/action-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ListUnlinkButton({
  label,
  unlinkAction,
  confirmMessage,
}: {
  label: string;
  unlinkAction: () => Promise<ActionState>;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => unlinkAction(),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      className="shrink-0"
      onSubmit={
        confirmMessage
          ? (event) => {
              if (!window.confirm(confirmMessage)) {
                event.preventDefault();
              }
            }
          : undefined
      }
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
        className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
      >
        <XIcon className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
