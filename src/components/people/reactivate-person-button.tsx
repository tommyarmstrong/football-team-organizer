"use client";

import { useState, useTransition } from "react";
import { reactivatePersonAction } from "@/lib/people/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ReactivatePersonButton({ personId }: { personId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onReactivate() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await reactivatePersonAction(personId);
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Person re-activated.");
    });
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorBanner message={error} /> : null}
      {message ? (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button type="button" onClick={onReactivate} disabled={pending}>
        {pending ? "Re-activating…" : "Re-activate person"}
      </Button>
    </div>
  );
}
