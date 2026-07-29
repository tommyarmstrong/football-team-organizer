"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { createClubAction } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CreateClubForm() {
  const [state, formAction, pending] = useActionState(
    createClubAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="club-name">
          Club name <span className="text-muted-foreground">(required)</span>
        </Label>
        <Input
          id="club-name"
          name="name"
          required
          aria-required="true"
          placeholder="e.g. Example FC"
          disabled={pending}
        />
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create club"}
      </Button>
    </form>
  );
}
