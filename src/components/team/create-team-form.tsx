"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  AGE_GROUPS,
  TEAM_GENDERS,
  TRAINING_DAYS,
  TRAINING_DAY_LABELS,
} from "@/lib/constants";
import { createTeamAction } from "@/lib/team/actions";
import type { CoachWithPerson } from "@/lib/data/coaches";
import type { Venue } from "@/lib/supabase/database.types";
import { coachDisplayName, labelGender } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CreateTeamForm({
  coaches = [],
  venues = [],
}: {
  coaches?: CoachWithPerson[];
  venues?: Venue[];
}) {
  const [state, formAction, pending] = useActionState(
    createTeamAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-team-name">Team name</Label>
          <Input id="new-team-name" name="name" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-age">Age group</Label>
          <NativeSelect
            id="new-team-age"
            name="age_group"
            required
            defaultValue="U11"
            disabled={pending}
          >
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-gender">Gender</Label>
          <NativeSelect
            id="new-team-gender"
            name="gender"
            required
            defaultValue="mixed"
            disabled={pending}
          >
            {TEAM_GENDERS.map((g) => (
              <option key={g} value={g}>
                {labelGender(g)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-venue">Home venue</Label>
          <NativeSelect
            id="new-team-venue"
            name="home_venue_id"
            disabled={pending}
          >
            <option value="">None</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-training-venue">Training venue</Label>
          <NativeSelect
            id="new-team-training-venue"
            name="training_venue_id"
            disabled={pending}
          >
            <option value="">None</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-coach">Head coach</Label>
          <NativeSelect
            id="new-team-coach"
            name="head_coach_id"
            disabled={pending}
          >
            <option value="">None</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coachDisplayName(coach)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-season">Season</Label>
          <Input
            id="new-team-season"
            name="season_label"
            required
            placeholder="e.g. 2025/26"
            disabled={pending}
          />
        </div>
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
                disabled={pending}
                className="border-input size-4 rounded"
              />
              {TRAINING_DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create team"}
      </Button>
    </form>
  );
}
