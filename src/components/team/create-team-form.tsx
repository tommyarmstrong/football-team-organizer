"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { TEAM_GENDERS } from "@/lib/constants";
import { createTeamAction } from "@/lib/team/actions";
import { labelGender } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CreateTeamForm() {
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
          <Input
            id="new-team-age"
            name="age_group"
            required
            placeholder="e.g. U11"
            disabled={pending}
          />
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
          <Label htmlFor="new-team-ground">Home ground</Label>
          <Input
            id="new-team-ground"
            name="home_ground"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-team-coach">Head coach</Label>
          <Input
            id="new-team-coach"
            name="head_coach_name"
            required
            disabled={pending}
          />
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

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create team"}
      </Button>
    </form>
  );
}
