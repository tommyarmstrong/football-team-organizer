"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addPlayerToTeamAction,
  removePlayerFromTeamAction,
} from "@/lib/players/actions";
import { setActiveTeamAction } from "@/lib/team/actions";
import type { Team } from "@/lib/supabase/database.types";
import type { PlayerTeamMembership } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
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
          {memberships.map((membership) => (
            <li key={membership.team_player_id} className="flex items-stretch">
              <OpenTeamRow membership={membership} />
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Remove from ${membership.team_name}`}
                    confirmMessage="Remove this player from the team?"
                    unlinkAction={() =>
                      removePlayerFromTeamAction(
                        membership.team_player_id,
                        playerId,
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
        <AddToTeamForm playerId={playerId} availableTeams={availableTeams} />
      ) : null}
    </div>
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
      <span className="text-muted-foreground shrink-0">
        {membership.shirt_number != null
          ? `#${membership.shirt_number}`
          : "No shirt"}
        {membership.active ? "" : " · Inactive"}
      </span>
    </button>
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
      <div className="space-y-2 sm:w-28">
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
        <div className="w-full sm:basis-full">
          <ErrorBanner message={state.error} />
        </div>
      ) : null}
    </form>
  );
}
