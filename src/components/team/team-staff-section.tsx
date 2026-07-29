"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COACH_TEAM_ROLES } from "@/lib/constants";
import {
  addCoachToTeamAction,
  createTeamCoachAction,
  removeCoachFromTeamAction,
} from "@/lib/coaches/actions";
import type { Coach } from "@/lib/supabase/database.types";
import type { TeamCoachEntry } from "@/lib/data/coaches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamStaffSection({
  teamId,
  clubId,
  assigned,
  candidates,
  canEdit,
}: {
  teamId: string;
  clubId: string;
  assigned: TeamCoachEntry[];
  candidates: Coach[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="space-y-4">
          <CreateTeamCoachForm teamId={teamId} clubId={clubId} />
          {candidates.length > 0 ? (
            <AssignCoachForm teamId={teamId} candidates={candidates} />
          ) : null}
        </div>
      ) : null}

      {assigned.length === 0 ? (
        <EmptyState
          title="No coaches assigned"
          description={
            canEdit
              ? "Create a coach above, or assign existing club coaching staff."
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
    </div>
  );
}

function CreateTeamCoachForm({
  teamId,
  clubId,
}: {
  teamId: string;
  clubId: string;
}) {
  const bound = createTeamCoachAction.bind(null, teamId, clubId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border space-y-3 rounded-xl border p-4"
    >
      <p className="text-sm font-medium">Add new coach to team</p>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="new-coach-first">First name</Label>
          <Input
            id="new-coach-first"
            name="first_name"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-coach-second">Second name</Label>
          <Input
            id="new-coach-second"
            name="second_name"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-coach-joined">Joined date</Label>
          <Input
            id="new-coach-joined"
            name="joined_date"
            type="date"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-coach-role">Role on this team</Label>
          <NativeSelect id="new-coach-role" name="role" disabled={pending}>
            <option value="">Select role</option>
            {COACH_TEAM_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-coach-phone">Phone</Label>
          <Input
            id="new-coach-phone"
            name="phone"
            type="tel"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-coach-email">Email</Label>
          <Input
            id="new-coach-email"
            name="email"
            type="email"
            disabled={pending}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            name="dbs_checked"
            disabled={pending}
            className="border-input size-4 rounded"
          />
          DBS checked
        </label>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            name="fa_level_1"
            disabled={pending}
            className="border-input size-4 rounded"
          />
          FA Level 1
        </label>
        <label className="flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            name="fa_level_2"
            disabled={pending}
            className="border-input size-4 rounded"
          />
          FA Level 2
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add coach"}
      </Button>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
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

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
    >
      <input type="hidden" name="team_id" value={teamId} />
      <div className="space-y-2">
        <Label htmlFor="assign-coach">Assign existing coach</Label>
        <NativeSelect
          id="assign-coach"
          name="coach_id"
          required
          disabled={pending}
        >
          <option value="">Select a club coach</option>
          {candidates.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.first_name} {coach.second_name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assign-role">Role</Label>
        <NativeSelect id="assign-role" name="role" disabled={pending}>
          <option value="">Select role</option>
          {COACH_TEAM_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </NativeSelect>
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
