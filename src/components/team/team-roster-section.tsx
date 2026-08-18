"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  addRosterPlayerAction,
  removePlayerFromTeamAction,
} from "@/lib/players/actions";
import { playerDisplayName } from "@/lib/format";
import type { PlayerWithPerson } from "@/lib/data/players";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { ListUnlinkButton } from "@/components/shared/list-unlink-button";
import { objectListRowClassName } from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function TeamRosterSection({
  teamId,
  roster,
  candidates,
  canEdit,
}: {
  teamId: string;
  roster: RosterPlayer[];
  candidates: PlayerWithPerson[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      {roster.length === 0 ? (
        <EmptyState
          title="No players in this squad"
          description={
            canEdit
              ? "Select a club player below to add them to this squad."
              : "Players assigned to this team will appear here."
          }
        />
      ) : (
        <FilterablePaginatedList
          items={roster}
          getItemKey={(entry) => entry.team_player_id}
          getSearchText={(entry) =>
            `${playerDisplayName(entry)} ${entry.position ?? ""} ${entry.shirt_number ?? ""}`
          }
          filterPlaceholder="Filter squad by name…"
          singularLabel="player"
          pluralLabel="players"
          totalCountPhrase="in this squad"
          defaultPageSize={20}
          emptyFilterTitle="No players match"
          emptyFilterDescription="Try a different name, or clear the filter."
          renderItem={(entry) => (
            <div className="flex items-stretch">
              <Link
                href={`/people/${entry.person_id}`}
                className={objectListRowClassName()}
              >
                <span className="text-muted-foreground w-[2ch] shrink-0 text-right tabular-nums">
                  {entry.shirt_number ?? "—"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {playerDisplayName(entry)}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {entry.position ?? "No position"}
                </span>
              </Link>
              {canEdit ? (
                <div className="flex items-center pr-2">
                  <ListUnlinkButton
                    label={`Remove ${playerDisplayName(entry)} from squad`}
                    confirmMessage={`Remove ${playerDisplayName(entry)} from this squad?`}
                    unlinkAction={() =>
                      removePlayerFromTeamAction(entry.team_player_id, entry.id)
                    }
                  />
                </div>
              ) : null}
            </div>
          )}
        />
      )}

      {canEdit ? (
        <AddRosterPlayerForm teamId={teamId} candidates={candidates} />
      ) : null}
    </div>
  );
}

function AddRosterPlayerForm({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: PlayerWithPerson[];
}) {
  const bound = addRosterPlayerAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  if (candidates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Every club player is already on this squad.
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
        <Label htmlFor="roster-player">Select player</Label>
        <SearchableSelect
          id="roster-player"
          name="player_id"
          required
          disabled={pending}
          placeholder="Search players by name…"
          emptyMessage="No players match that name."
          options={candidates.map((player) => ({
            value: player.id,
            label: playerDisplayName(player),
          }))}
        />
      </div>
      <div className="space-y-2 sm:w-36">
        <Label htmlFor="roster-shirt">
          Shirt number <OptionalHint />
        </Label>
        <Input
          id="roster-shirt"
          name="shirt_number"
          inputMode="numeric"
          min={1}
          step={1}
          disabled={pending}
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
