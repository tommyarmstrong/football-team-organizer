"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { createCoachAction, updateCoachAction } from "@/lib/coaches/actions";
import type { Coach } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CoachForm({
  coach,
  mode,
}: {
  coach?: Coach;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? createCoachAction
      : updateCoachAction.bind(null, coach!.id);

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
            defaultValue={coach?.first_name}
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
            defaultValue={coach?.second_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joined_date">
            Joined date{" "}
            <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="joined_date"
            name="joined_date"
            type="date"
            required
            aria-required="true"
            defaultValue={coach?.joined_date}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of birth</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={coach?.date_of_birth ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={coach?.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={coach?.email ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Qualifications</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="dbs_checked"
              defaultChecked={coach?.dbs_checked}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            DBS checked
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="fa_level_1"
              defaultChecked={coach?.fa_level_1}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            FA Level 1
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="fa_level_2"
              defaultChecked={coach?.fa_level_2}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            FA Level 2
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="biography">Biography</Label>
        <Textarea
          id="biography"
          name="biography"
          rows={4}
          placeholder="Background, experience, and coaching style"
          defaultValue={coach?.biography ?? ""}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={coach?.notes ?? ""}
          disabled={pending}
        />
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Add coach" : "Save coach"}
      </Button>
    </form>
  );
}
