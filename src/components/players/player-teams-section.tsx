"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addPlayerToTeamAction,
  removePlayerFromTeamAction,
  updateRosterEntryAction,
} from "@/lib/players/actions";
import { setActiveTeamAction } from "@/lib/team/actions";
import type { Team } from "@/lib/supabase/database.types";
import type { PlayerTeamMembership } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconButton } from "@/components/shared/edit-icon-control";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { RoleChip } from "@/components/shared/role-chip";
import { SearchableSelect } from "@/components/shared/searchable-select";

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
    <div className="space-y-4">
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
        <ul className={objectListClassName}>
          {memberships.map((membership) =>
            canEdit ? (
              <MembershipRow
                key={membership.team_player_id}
                playerId={playerId}
                membership={membership}
              />
            ) : (
              <li
                key={membership.team_player_id}
                className="flex items-stretch"
              >
                <OpenTeamRow membership={membership} />
              </li>
            ),
          )}
        </ul>
      )}

      {canEdit ? (
        <AddToTeamForm playerId={playerId} availableTeams={availableTeams} />
      ) : null}
    </div>
  );
}

function MembershipChips({ membership }: { membership: PlayerTeamMembership }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {membership.shirt_number != null ? (
        <RoleChip>#{membership.shirt_number}</RoleChip>
      ) : null}
      <RoleChip>{membership.active ? "Active" : "Inactive"}</RoleChip>
    </span>
  );
}

function OpenTeamRow({ membership }: { membership: PlayerTeamMembership }) {
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
      <MembershipChips membership={membership} />
    </button>
  );
}

function MembershipRow({
  playerId,
  membership,
}: {
  playerId: string;
  membership: PlayerTeamMembership;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">
            {membership.team_name}
          </span>
          <ListUnlinkButton
            label={`Remove from ${membership.team_name}`}
            confirmMessage="Remove this player from the team?"
            unlinkAction={() =>
              removePlayerFromTeamAction(membership.team_player_id, playerId)
            }
          />
        </div>
        <EditMembershipForm
          playerId={playerId}
          membership={membership}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-stretch">
      <OpenTeamRow membership={membership} />
      <div className="flex items-center gap-1 pr-2">
        <EditIconButton
          label={`Edit ${membership.team_name} squad details`}
          onClick={() => setEditing(true)}
        />
        <ListUnlinkButton
          label={`Remove from ${membership.team_name}`}
          confirmMessage="Remove this player from the team?"
          unlinkAction={() =>
            removePlayerFromTeamAction(membership.team_player_id, playerId)
          }
        />
      </div>
    </li>
  );
}

function EditMembershipForm({
  playerId,
  membership,
  onCancel,
}: {
  playerId: string;
  membership: PlayerTeamMembership;
  onCancel: () => void;
}) {
  const bound = updateRosterEntryAction.bind(
    null,
    membership.team_player_id,
    playerId,
  );
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="space-y-2 sm:w-24">
        <Label htmlFor={`edit-shirt-${membership.team_player_id}`}>
          Shirt #
        </Label>
        <Input
          id={`edit-shirt-${membership.team_player_id}`}
          name="shirt_number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={membership.shirt_number ?? ""}
          disabled={pending}
          placeholder="Optional"
          className="tabular-nums"
        />
      </div>
      <div className="space-y-2 sm:w-36">
        <Label htmlFor={`edit-active-${membership.team_player_id}`}>
          Status
        </Label>
        <NativeSelect
          id={`edit-active-${membership.team_player_id}`}
          name="active"
          defaultValue={membership.active ? "true" : "false"}
          disabled={pending}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </NativeSelect>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      {state.error ? (
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
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
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="add-team">Add to team</Label>
        <SearchableSelect
          id="add-team"
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
      <div className="space-y-2 sm:w-24">
        <Label htmlFor="add-team-shirt">Shirt #</Label>
        <Input
          id="add-team-shirt"
          name="shirt_number"
          inputMode="numeric"
          min={1}
          step={1}
          disabled={pending}
          placeholder="Optional"
          className="tabular-nums"
        />
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
