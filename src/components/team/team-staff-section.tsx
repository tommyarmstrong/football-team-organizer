"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COACH_TEAM_ROLES } from "@/lib/constants";
import {
  addCoachToTeamAction,
  removeCoachFromTeamAction,
} from "@/lib/coaches/actions";
import type { Coach } from "@/lib/supabase/database.types";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamStaffSection({
  teamId,
  assigned,
  candidates,
  canEdit,
}: {
  teamId: string;
  assigned: TeamCoachEntry[];
  candidates: Coach[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {assigned.length === 0 ? (
        <EmptyState
          title="No coaches assigned"
          description={
            canEdit
              ? "Select a club coach below to assign them to this team."
              : "Coaching staff for this team will appear here."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {assigned.map((entry) => (
            <li
              key={entry.team_coach_id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <Link
                href={`/coaches/${entry.coach_id}`}
                className="font-medium hover:underline"
              >
                {entry.name}
              </Link>
              <span className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {entry.role ?? "Coach"}
                </span>
                {canEdit ? <RemoveCoachButton entry={entry} /> : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <AssignCoachForm teamId={teamId} candidates={candidates} />
      ) : null}
    </div>
  );
}

function AssignCoachForm({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: Coach[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof INITIAL_ACTION_STATE, formData: FormData) => {
      const coachId = String(formData.get("coach_id") ?? "");
      if (!coachId) return { error: "Select a coach." };
      return addCoachToTeamAction(coachId, INITIAL_ACTION_STATE, formData);
    },
    INITIAL_ACTION_STATE,
  );

  if (candidates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Every club coach is already assigned to this team.
      </p>
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="team_id" value={teamId} />
      <NativeSelect
        id="assign-coach"
        name="coach_id"
        required
        disabled={pending}
        aria-label="Select coach"
        className="min-w-0 flex-1"
      >
        <option value="">Select coach</option>
        {candidates.map((coach) => (
          <option key={coach.id} value={coach.id}>
            {coach.first_name} {coach.second_name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        id="assign-role"
        name="role"
        disabled={pending}
        aria-label="Role"
        className="sm:w-40"
      >
        <option value="">Select role</option>
        {COACH_TEAM_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}

function RemoveCoachButton({ entry }: { entry: TeamCoachEntry }) {
  const [state, formAction, pending] = useActionState(
    async () => removeCoachFromTeamAction(entry.team_coach_id, entry.coach_id),
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
