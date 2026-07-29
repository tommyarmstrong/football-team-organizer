"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addPlayerToTeamAction,
  removePlayerFromTeamAction,
  updateRosterEntryAction,
} from "@/lib/players/actions";
import type { Team } from "@/lib/supabase/database.types";
import type { PlayerTeamMembership } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function PlayerTeamsSection({
  playerId,
  memberships,
  availableTeams,
  canEdit,
}: {
  playerId: string;
  memberships: PlayerTeamMembership[];
  availableTeams: Pick<Team, "id" | "name">[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {canEdit ? (
        <AddToTeamForm playerId={playerId} availableTeams={availableTeams} />
      ) : null}

      {memberships.length === 0 ? (
        <EmptyState
          title="Not on any team"
          description={
            canEdit
              ? "Assign this player to one or more teams."
              : "This player is not assigned to a team yet."
          }
        />
      ) : (
        <ul className="space-y-3">
          {memberships.map((membership) => (
            <li
              key={membership.team_player_id}
              className="border-border rounded-xl border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Link href="/team" className="font-medium hover:underline">
                  {membership.team_name}
                </Link>
                <span className="text-muted-foreground text-sm">
                  {membership.shirt_number != null
                    ? `#${membership.shirt_number}`
                    : "No shirt"}
                  {membership.active ? "" : " · Inactive"}
                </span>
              </div>
              {canEdit ? (
                <MembershipControls
                  playerId={playerId}
                  membership={membership}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddToTeamForm({
  playerId,
  availableTeams,
}: {
  playerId: string;
  availableTeams: Pick<Team, "id" | "name">[];
}) {
  const bound = addPlayerToTeamAction.bind(null, playerId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  if (availableTeams.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This player is already on all teams you can manage.
      </p>
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
    >
      <div className="space-y-2">
        <Label htmlFor="add-team">Add to team</Label>
        <NativeSelect id="add-team" name="team_id" required disabled={pending}>
          <option value="">Select a team</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-shirt">Shirt</Label>
        <Input
          id="add-shirt"
          name="shirt_number"
          type="number"
          min={1}
          disabled={pending}
        />
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
  );
}

function MembershipControls({
  playerId,
  membership,
}: {
  playerId: string;
  membership: PlayerTeamMembership;
}) {
  const boundUpdate = updateRosterEntryAction.bind(
    null,
    membership.team_player_id,
    playerId,
  );
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );
  const [removeState, removeAction, removePending] = useActionState(
    async () => removePlayerFromTeamAction(membership.team_player_id, playerId),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="mt-3 space-y-3">
      <form
        action={formAction}
        className="grid gap-3 sm:grid-cols-[8rem_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor={`m-shirt-${membership.team_player_id}`}>Shirt</Label>
          <Input
            id={`m-shirt-${membership.team_player_id}`}
            name="shirt_number"
            type="number"
            min={1}
            defaultValue={membership.shirt_number ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`m-active-${membership.team_player_id}`}>
            Status
          </Label>
          <NativeSelect
            id={`m-active-${membership.team_player_id}`}
            name="active"
            defaultValue={membership.active ? "true" : "false"}
            disabled={pending}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <form
        action={removeAction}
        onSubmit={(event) => {
          if (!window.confirm("Remove this player from the team?")) {
            event.preventDefault();
          }
        }}
      >
        {removeState.error ? <ErrorBanner message={removeState.error} /> : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={removePending}
        >
          {removePending ? "Removing…" : "Remove from team"}
        </Button>
      </form>
    </div>
  );
}
