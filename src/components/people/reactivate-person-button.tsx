"use client";

import { useState, useTransition } from "react";
import { reactivatePersonAction } from "@/lib/people/actions";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ReactivatePersonButton({ personId }: { personId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onReactivate() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await reactivatePersonAction(personId);
      if (result.error) setError(result.error);
      else setSuccess(result.success ?? "Person reactivated.");
    });
  }

  return (
    <div className="space-y-2">
      {error ? <ErrorBanner message={error} /> : null}
      {success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {success}
        </p>
      ) : null}
      <Button type="button" onClick={onReactivate} disabled={pending}>
        {pending ? "Reactivating…" : "Reactivate person"}
      </Button>
    </div>
  );
}
