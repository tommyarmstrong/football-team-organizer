"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { PLAYER_POSITIONS } from "@/lib/constants";
import { createPersonAction, updatePersonAction } from "@/lib/people/actions";
import type { PersonPlayerRef } from "@/lib/data/people";
import type { Person } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function PersonForm({
  person,
  player,
  mode,
}: {
  person?: Person;
  player?: PersonPlayerRef | null;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? createPersonAction
      : updatePersonAction.bind(null, person!.id);

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
            defaultValue={person?.first_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="last_name"
            name="last_name"
            required
            aria-required="true"
            defaultValue={person?.last_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={person?.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={person?.phone ?? ""}
            disabled={pending}
          />
        </div>
        {player ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">DOB</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={player.date_of_birth ?? ""}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <NativeSelect
                id="position"
                name="position"
                defaultValue={player.position ?? ""}
                disabled={pending}
              >
                <option value="">None</option>
                {PLAYER_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                name="school"
                defaultValue={player.school ?? ""}
                disabled={pending}
              />
            </div>
            <input type="hidden" name="player_id" value={player.id} />
          </>
        ) : null}
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create person"
            : "Save person"}
      </Button>
    </form>
  );
}
