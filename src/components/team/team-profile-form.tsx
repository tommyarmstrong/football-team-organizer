"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  AGE_GROUPS,
  TEAM_GENDERS,
  TRAINING_DAYS,
  TRAINING_DAY_LABELS,
} from "@/lib/constants";
import { updateTeamAction } from "@/lib/team/actions";
import type { CoachWithPerson } from "@/lib/data/coaches";
import type { Team, Venue } from "@/lib/supabase/database.types";
import { coachDisplayName, labelGender } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";
import { SeasonInput } from "@/components/team/season-input";

export function TeamProfileForm({
  team,
  coaches,
  venues,
  headCoachId,
}: {
  team: Team;
  coaches: CoachWithPerson[];
  venues: Venue[];
  headCoachId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateTeamAction,
    INITIAL_ACTION_STATE,
  );
  const [previewSrc, setPreviewSrc] = useState(team.photo_url ?? "");
  const [clearPhoto, setClearPhoto] = useState(false);

  const selectedDays = new Set(team.training_days ?? []);

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="clear_photo"
        value={clearPhoto ? "true" : ""}
      />

      <div className="space-y-2">
        <Label htmlFor="team-photo">
          Team photo <OptionalHint />
        </Label>
        <div className="space-y-3">
          {previewSrc && !clearPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-40 w-full rounded-xl object-cover sm:h-56"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-40 w-full items-center justify-center rounded-xl text-sm sm:h-56">
              No team photo
            </div>
          )}
          <Input
            id="team-photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setClearPhoto(false);
              setPreviewSrc(URL.createObjectURL(file));
            }}
          />
          <p className="text-muted-foreground text-xs">
            PNG, JPEG, WebP, or GIF. Max 5 MB. Shown above the team profile.
          </p>
          {team.photo_url ? (
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={clearPhoto}
                disabled={pending}
                onChange={(event) => setClearPhoto(event.target.checked)}
              />
              Remove uploaded photo
            </label>
          ) : null}
        </div>
      </div>

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
        <Field label="Display name" htmlFor="display_name" optional>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Shown on dashboard, matches, and stats"
            defaultValue={team.display_name ?? ""}
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
            {(TEAM_GENDERS.includes(team.gender)
              ? TEAM_GENDERS
              : [...TEAM_GENDERS, team.gender]
            ).map((g) => (
              <option key={g} value={g}>
                {labelGender(g)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Season" htmlFor="season_label">
          <SeasonInput
            id="season_label"
            name="season_label"
            required
            defaultValue={team.season_label}
            disabled={pending}
          />
        </Field>
        <Field label="Head coach" htmlFor="head_coach_id" optional>
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
        <Field label="Home venue" htmlFor="home_venue_id" optional>
          <NativeSelect
            id="home_venue_id"
            name="home_venue_id"
            defaultValue={team.home_venue_id ?? ""}
            disabled={pending}
          >
            <option value="">None</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Training venue" htmlFor="training_venue_id" optional>
          <NativeSelect
            id="training_venue_id"
            name="training_venue_id"
            defaultValue={team.training_venue_id ?? ""}
            disabled={pending}
          >
            <option value="">None</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Training days <OptionalHint />
        </legend>
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

      <FormActions pending={pending} cancelHref="/team" />
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <OptionalHint /> : null}
      </Label>
      {children}
    </div>
  );
}
