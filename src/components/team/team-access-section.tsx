"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addTeamMemberAction,
  removeTeamMemberAction,
} from "@/lib/members/actions";
import { TEAM_ROLES, TEAM_ROLE_LABELS } from "@/lib/constants";
import type { TeamMember } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamAccessSection({
  teamId,
  members,
}: {
  teamId: string;
  members: TeamMember[];
}) {
  const bound = addTeamMemberAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-6">
      <form
        key={state.success ?? "idle"}
        action={formAction}
        className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="member-user-id">Auth user UUID</Label>
          <Input
            id="member-user-id"
            name="user_id"
            placeholder="Supabase Auth user id"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-role">Role</Label>
          <NativeSelect
            id="member-role"
            name="role"
            required
            disabled={pending}
          >
            {TEAM_ROLES.map((role) => (
              <option key={role} value={role}>
                {TEAM_ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
        {state.error ? (
          <div className="sm:col-span-3">
            <ErrorBanner message={state.error} />
          </div>
        ) : null}
      </form>

      <p className="text-muted-foreground text-xs">
        A user may hold any combination of roles on this team (add one row per
        role). The same person can have different roles on other teams.
      </p>

      {members.length === 0 ? (
        <EmptyState
          title="No team accounts linked"
          description="Add any combination of roles by Auth user id (one row per role)."
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">
                  {TEAM_ROLE_LABELS[member.role]}
                </span>
                <span className="text-muted-foreground block truncate font-mono text-xs">
                  {member.user_id}
                </span>
              </span>
              <RemoveMemberButton id={member.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RemoveMemberButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    async () => removeTeamMemberAction(id),
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
