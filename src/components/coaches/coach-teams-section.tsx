"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addCoachToTeamAction,
  removeCoachFromTeamAction,
} from "@/lib/coaches/actions";
import type { Team } from "@/lib/supabase/database.types";
import type { CoachTeamMembership } from "@/lib/data/coaches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function CoachTeamsSection({
  coachId,
  memberships,
  availableTeams,
  canEdit,
}: {
  coachId: string;
  memberships: CoachTeamMembership[];
  availableTeams: Pick<Team, "id" | "name">[];
  canEdit: boolean;
}) {
  const bound = addCoachToTeamAction.bind(null, coachId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-6">
      {canEdit && availableTeams.length > 0 ? (
        <form
          key={state.success ?? "idle"}
          action={formAction}
          className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="coach-team">Assign to team</Label>
            <NativeSelect
              id="coach-team"
              name="team_id"
              required
              disabled={pending}
            >
              <option value="">Select a team</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-team-role">Role</Label>
            <Input
              id="coach-team-role"
              name="role"
              placeholder="e.g. Head coach"
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Assigning…" : "Assign"}
          </Button>
          {state.error ? (
            <div className="sm:col-span-3">
              <ErrorBanner message={state.error} />
            </div>
          ) : null}
        </form>
      ) : null}

      {memberships.length === 0 ? (
        <EmptyState
          title="Not assigned to a team"
          description={
            canEdit
              ? "Assign this coach to one or more teams."
              : "This coach is not assigned to a team yet."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {memberships.map((membership) => (
            <li
              key={membership.team_coach_id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium">{membership.team_name}</span>
              <span className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {membership.role ?? "Coach"}
                </span>
                {canEdit ? (
                  <RemoveButton
                    teamCoachId={membership.team_coach_id}
                    coachId={coachId}
                  />
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RemoveButton({
  teamCoachId,
  coachId,
}: {
  teamCoachId: string;
  coachId: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => removeCoachFromTeamAction(teamCoachId, coachId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction}>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Remove"}
      </Button>
    </form>
  );
}
