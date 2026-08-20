"use client";

import { useState, useTransition } from "react";
import { updateMatchStatusAction } from "@/lib/matches/actions";
import type { MatchStatus } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
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

  if (status === "played" || status === "cancelled" || status === "postponed") {
    return null;
  }

  const showKickOff = status === "scheduled";

  function setStatus(next: MatchStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateMatchStatusAction(matchId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <div
        className={
          showKickOff ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"
        }
      >
        {showKickOff ? (
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => setStatus("in_progress")}
          >
            Kick off
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => setStatus("played")}
        >
          Full time
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          disabled={pending}
          onClick={() => setStatus("cancelled")}
        >
          Cancelled
        </Button>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
