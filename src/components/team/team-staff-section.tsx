"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COACH_TEAM_ROLES } from "@/lib/constants";
import {
  addCoachToTeamAction,
  removeCoachFromTeamAction,
} from "@/lib/coaches/actions";
import type { CoachWithPerson } from "@/lib/data/coaches";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import { coachDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function TeamStaffSection({
  teamId,
  assigned,
  candidates,
  canEdit,
}: {
  teamId: string;
  assigned: TeamCoachEntry[];
  candidates: CoachWithPerson[];
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
        <ul className={objectListClassName}>
          {assigned.map((entry) => (
            <li key={entry.team_coach_id} className="flex items-stretch">
              <Link
                href={`/coaches/${entry.coach_id}`}
                className={objectListRowClassName()}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {entry.name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {entry.role ?? "Coach"}
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Remove ${entry.name} from coaching staff`}
                    unlinkAction={() =>
                      removeCoachFromTeamAction(
                        entry.team_coach_id,
                        entry.coach_id,
                      )
                    }
                  />
                </div>
              ) : null}
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
  candidates: CoachWithPerson[];
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
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="assign-coach">Select coach</Label>
        <SearchableSelect
          id="assign-coach"
          name="coach_id"
          required
          disabled={pending}
          placeholder="Search coaches by name…"
          emptyMessage="No coaches match that name."
          options={candidates.map((coach) => ({
            value: coach.id,
            label: coachDisplayName(coach),
          }))}
        />
      </div>
      <div className="space-y-2 sm:w-40">
        <Label htmlFor="assign-role">Role</Label>
        <NativeSelect
          id="assign-role"
          name="role"
          disabled={pending}
          aria-label="Role"
        >
          <option value="">Select role</option>
          {COACH_TEAM_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </NativeSelect>
      </div>
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
