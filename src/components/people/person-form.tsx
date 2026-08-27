"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { PLAYER_POSITIONS } from "@/lib/constants";
import { createPersonAction, updatePersonAction } from "@/lib/people/actions";
import { PERSON_ROLE_ORDER } from "@/lib/people/roles";
import type { PersonPlayerRef } from "@/lib/data/people";
import type { Person } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

const ROLE_LABELS = {
  player: "Player",
  guardian: "Guardian",
  coach: "Coach",
  manager: "Manager",
} as const;

export function PersonForm({
  person,
  player,
  mode,
  showPlayerDobSchool = Boolean(player),
  showPlayerPosition = Boolean(player),
}: {
  person?: Person;
  player?: PersonPlayerRef | null;
  mode: "create" | "edit";
  showPlayerDobSchool?: boolean;
  showPlayerPosition?: boolean;
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
          <Label htmlFor="email">
            Email <OptionalHint />
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={person?.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <OptionalHint />
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={person?.phone ?? ""}
            disabled={pending}
          />
        </div>
        {player && (showPlayerDobSchool || showPlayerPosition) ? (
          <>
            {showPlayerDobSchool ? (
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">
                  DOB <OptionalHint />
                </Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  defaultValue={player.date_of_birth ?? ""}
                  disabled={pending}
                />
              </div>
            ) : null}
            {showPlayerPosition ? (
              <div className="space-y-2">
                <Label htmlFor="position">
                  Position <OptionalHint />
                </Label>
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
            ) : null}
            {showPlayerDobSchool ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="school">
                  School <OptionalHint />
                </Label>
                <Input
                  id="school"
                  name="school"
                  defaultValue={player.school ?? ""}
                  disabled={pending}
                />
              </div>
            ) : null}
            <input type="hidden" name="player_id" value={player.id} />
          </>
        ) : null}
      </div>

      {mode === "create" ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Club roles</legend>
          <p className="text-muted-foreground text-sm">
            Optionally assign club roles now. You can change these later on the
            person page.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSON_ROLE_ORDER.map((role) => (
              <label
                key={role}
                htmlFor={`role_${role}`}
                className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  id={`role_${role}`}
                  name={`role_${role}`}
                  type="checkbox"
                  value="on"
                  className="border-input size-4 rounded border"
                  disabled={pending}
                />
                {ROLE_LABELS[role]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {state.error ? <ErrorBanner message={state.error} /> : null}

      {mode === "edit" && person ? (
        <FormActions pending={pending} cancelHref={`/people/${person.id}`} />
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create person"}
        </Button>
      )}
    </form>
  );
}
