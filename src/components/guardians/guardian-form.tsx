"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createGuardianAction,
  updateGuardianAction,
} from "@/lib/guardians/actions";
import type { GuardianWithPerson } from "@/lib/data/guardians";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function GuardianForm({
  guardian,
  mode,
}: {
  guardian?: GuardianWithPerson;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? createGuardianAction
      : updateGuardianAction.bind(null, guardian!.id);

  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="first_name"
            name="first_name"
            required
            aria-required="true"
            defaultValue={guardian?.first_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="second_name">
            Second name{" "}
            <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="second_name"
            name="second_name"
            required
            aria-required="true"
            defaultValue={guardian?.second_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={guardian?.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={guardian?.email ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={guardian?.notes ?? ""}
          disabled={pending}
        />
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      {mode === "edit" && guardian ? (
        <FormActions
          pending={pending}
          cancelHref={`/guardians/${guardian.id}`}
        />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add guardian"}
        </Button>
      )}
    </form>
  );
}
