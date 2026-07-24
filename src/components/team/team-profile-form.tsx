"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { TEAM_GENDERS } from "@/lib/constants";
import { updateTeamAction } from "@/lib/team/actions";
import type { Team } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamProfileForm({ team }: { team: Team }) {
  const [state, formAction, pending] = useActionState(
    updateTeamAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Club" htmlFor="club">
          <Input
            id="club"
            name="club"
            required
            defaultValue={team.club}
            disabled={pending}
          />
        </Field>
        <Field label="Team name" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={team.name}
            disabled={pending}
          />
        </Field>
        <Field label="Age group" htmlFor="age_group">
          <Input
            id="age_group"
            name="age_group"
            required
            placeholder="e.g. U11"
            defaultValue={team.age_group}
            disabled={pending}
          />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <NativeSelect
            id="gender"
            name="gender"
            required
            defaultValue={team.gender}
            disabled={pending}
          >
            {TEAM_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Home ground" htmlFor="home_ground">
          <Input
            id="home_ground"
            name="home_ground"
            required
            defaultValue={team.home_ground}
            disabled={pending}
          />
        </Field>
        <Field label="Head coach" htmlFor="head_coach_name">
          <Input
            id="head_coach_name"
            name="head_coach_name"
            required
            defaultValue={team.head_coach_name}
            disabled={pending}
          />
        </Field>
        <Field label="Season" htmlFor="season_label">
          <Input
            id="season_label"
            name="season_label"
            required
            placeholder="e.g. 2025/26"
            defaultValue={team.season_label}
            disabled={pending}
          />
        </Field>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save team"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
