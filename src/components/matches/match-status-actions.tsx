"use client";

import { useState, useTransition } from "react";
import { updateMatchStatusAction } from "@/lib/matches/actions";
import type { MatchStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchStatusActions({
  matchId,
  status,
}: {
  matchId: string;
  status: MatchStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (status === "played" || status === "cancelled" || status === "postponed") {
    return null;
  }

  const showKickOff = status === "scheduled";
  const showFullTimePrimary = status === "in_progress";

  function setStatus(next: MatchStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateMatchStatusAction(matchId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showKickOff ? (
          <Button
            type="button"
            className="min-w-28"
            disabled={pending}
            onClick={() => setStatus("in_progress")}
          >
            Kick off
          </Button>
        ) : null}
        <Button
          type="button"
          variant={showFullTimePrimary ? "default" : "outline"}
          className="min-w-28"
          disabled={pending}
          onClick={() => setStatus("played")}
        >
          Full time
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="min-w-28"
          disabled={pending}
          aria-haspopup="dialog"
          onClick={() => setCancelOpen(true)}
        >
          Cancelled
        </Button>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Dialog
        open={cancelOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen && pending) return;
          setCancelOpen(nextOpen);
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>Cancel this match?</DialogTitle>
            <DialogDescription>
              This marks the fixture as cancelled. You can still view it later
              from the matches list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setCancelOpen(false)}
            >
              Keep match
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setCancelOpen(false);
                setStatus("cancelled");
              }}
            >
              {pending ? "Cancelling…" : "Cancel match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
