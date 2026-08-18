"use client";

import { Trash2Icon } from "lucide-react";
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
  "text-muted-foreground hover:bg-muted hover:text-destructive inline-flex size-11 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 sm:size-9";

export function ListDeleteButton({
  label,
  confirmMessage,
  deleteAction,
}: {
  label: string;
  confirmMessage: string;
  deleteAction: () => Promise<ActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async () => {
    const result = await deleteAction();
    if (result.error) {
      setOpen(true);
    }
    return result;
  }, INITIAL_ACTION_STATE);

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
        <Trash2Icon className="size-4" aria-hidden="true" />
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
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
