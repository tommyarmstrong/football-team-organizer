"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  AGE_GROUPS,
  TEAM_GENDERS,
  TRAINING_DAYS,
  TRAINING_DAY_LABELS,
} from "@/lib/constants";
import { updateTeamAction } from "@/lib/team/actions";
import type { Coach, Team } from "@/lib/supabase/database.types";
import { coachDisplayName, labelGender } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamProfileForm({
  team,
  coaches,
  headCoachId,
}: {
  team: Team;
  coaches: Coach[];
  headCoachId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateTeamAction,
    INITIAL_ACTION_STATE,
  );

  const selectedDays = new Set(team.training_days ?? []);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <NativeSelect
            id="age_group"
            name="age_group"
            required
            defaultValue={team.age_group}
            disabled={pending}
          >
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </NativeSelect>
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
                {labelGender(g)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Home venue" htmlFor="home_venue">
          <Input
            id="home_venue"
            name="home_venue"
            defaultValue={team.home_venue ?? ""}
            disabled={pending}
          />
        </Field>
        <Field label="Training venue" htmlFor="training_venue">
          <Input
            id="training_venue"
            name="training_venue"
            defaultValue={team.training_venue ?? ""}
            disabled={pending}
          />
        </Field>
        <Field label="Head coach" htmlFor="head_coach_id">
          <NativeSelect
            id="head_coach_id"
            name="head_coach_id"
            defaultValue={headCoachId ?? ""}
            disabled={pending}
          >
            <option value="">None</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coachDisplayName(coach)}
              </option>
            ))}
          </NativeSelect>
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Training days</legend>
        <div className="flex flex-wrap gap-3">
          {TRAINING_DAYS.map((day) => (
            <label
              key={day}
              className="flex min-h-9 items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="training_days"
                value={day}
                defaultChecked={selectedDays.has(day)}
                disabled={pending}
                className="border-input size-4 rounded"
              />
              {TRAINING_DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </fieldset>

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
