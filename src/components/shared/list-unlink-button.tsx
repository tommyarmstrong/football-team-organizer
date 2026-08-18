"use client";

import { XIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import type { ActionState } from "@/lib/action-state";
import { ErrorBanner } from "@/components/shared/error-banner";

const iconButtonClassName =
  "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-11 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 sm:size-9";

export function ListUnlinkButton({
  label,
  unlinkAction,
  confirmMessage,
}: {
  label: string;
  unlinkAction: () => Promise<ActionState>;
  confirmMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async () => {
    const result = await unlinkAction();
    if (result.error) {
      setOpen(true);
    }
    return result;
  }, INITIAL_ACTION_STATE);

  if (!confirmMessage) {
    return (
      <form action={formAction} className="shrink-0">
        {state.error ? (
          <div className="mb-1" role="alert">
            <ErrorBanner message={state.error} />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          aria-label={label}
          title={label}
          className={iconButtonClassName}
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={iconButtonClassName}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen && pending) {
            return;
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          {state.error ? <ErrorBanner message={state.error} /> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                void formAction();
              }}
            >
              {pending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
