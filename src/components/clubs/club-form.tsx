"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { updateClubAction } from "@/lib/clubs/actions";
import type { Club } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ClubForm({ club }: { club: Club }) {
  const [state, formAction, pending] = useActionState(
    updateClubAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={club.id} />
      <div className="space-y-2">
        <Label htmlFor="club-name">
          Club name <span className="text-muted-foreground">(required)</span>
        </Label>
        <Input
          id="club-name"
          name="name"
          required
          aria-required="true"
          defaultValue={club.name}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="club-website">Website</Label>
          <Input
            id="club-website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="https://"
            defaultValue={club.website ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-email">Email</Label>
          <Input
            id="club-email"
            name="email"
            type="email"
            defaultValue={club.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-phone">Phone</Label>
          <Input
            id="club-phone"
            name="phone"
            type="tel"
            defaultValue={club.phone ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save club"}
      </Button>
    </form>
  );
}
