"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { COACH_TEAM_ROLES } from "@/lib/constants";
import {
  addCoachToTeamAction,
  removeCoachFromTeamAction,
} from "@/lib/coaches/actions";
import { setActiveTeamAction } from "@/lib/team/actions";
import type { Team } from "@/lib/supabase/database.types";
import type { CoachTeamMembership } from "@/lib/data/coaches";
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
  return (
    <div className="space-y-4">
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
        <ul className={objectListClassName}>
          {memberships.map((membership) => (
            <li key={membership.team_coach_id} className="flex items-stretch">
              <OpenTeamRow membership={membership} />
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Remove from ${membership.team_name}`}
                    unlinkAction={() =>
                      removeCoachFromTeamAction(
                        membership.team_coach_id,
                        coachId,
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
        <AssignTeamForm coachId={coachId} availableTeams={availableTeams} />
      ) : null}
    </div>
  );
}

function OpenTeamRow({ membership }: { membership: CoachTeamMembership }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setActiveTeamAction(membership.team_id);
          router.push("/team");
        });
      }}
      className={objectListRowClassName("w-full text-left disabled:opacity-60")}
    >
      <span className="min-w-0 flex-1 truncate font-medium">
        {membership.team_name}
      </span>
      <span className="text-muted-foreground shrink-0">
        {membership.role ?? "Coach"}
      </span>
    </button>
  );
}

function AssignTeamForm({
  coachId,
  availableTeams,
}: {
  coachId: string;
  availableTeams: Pick<Team, "id" | "name">[];
}) {
  const bound = addCoachToTeamAction.bind(null, coachId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  if (availableTeams.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This coach is already assigned to all teams you can manage.
      </p>
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="coach-team">Assign to team</Label>
        <SearchableSelect
          id="coach-team"
          name="team_id"
          required
          disabled={pending}
          placeholder="Search teams by name…"
          emptyMessage="No teams match that name."
          options={availableTeams.map((team) => ({
            value: team.id,
            label: team.name,
          }))}
        />
      </div>
      <div className="space-y-2 sm:w-40">
        <Label htmlFor="coach-team-role">Role</Label>
        <NativeSelect id="coach-team-role" name="role" disabled={pending}>
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
