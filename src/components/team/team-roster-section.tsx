"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { PLAYER_POSITIONS } from "@/lib/constants";
import {
  addRosterPlayerAction,
  createRosterPlayerAction,
  removePlayerFromTeamAction,
  updateRosterEntryAction,
} from "@/lib/players/actions";
import { playerDisplayName } from "@/lib/format";
import type { Player } from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function TeamRosterSection({
  teamId,
  clubId,
  roster,
  candidates,
  canEdit,
}: {
  teamId: string;
  clubId: string;
  roster: RosterPlayer[];
  candidates: Player[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {canEdit ? (
        <div className="space-y-4">
          <CreateRosterPlayerForm teamId={teamId} clubId={clubId} />
          {candidates.length > 0 ? (
            <AddRosterPlayerForm teamId={teamId} candidates={candidates} />
          ) : null}
        </div>
      ) : null}

      {roster.length === 0 ? (
        <EmptyState
          title="No players in this squad"
          description={
            canEdit
              ? "Create a player above, or assign an existing club player."
              : "Players assigned to this team will appear here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {roster.map((entry) => (
            <li
              key={entry.team_player_id}
              className="border-border rounded-xl border p-4"
            >
              {canEdit ? (
                <RosterRow entry={entry} />
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={`/players/${entry.id}`}
                    className="font-medium hover:underline"
                  >
                    {playerDisplayName(entry, {
                      shirtNumber: entry.shirt_number,
                    })}
                  </Link>
                  <span className="text-muted-foreground">
                    {entry.position ?? "No position"}
                    {entry.active ? "" : " · Inactive"}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateRosterPlayerForm({
  teamId,
  clubId,
}: {
  teamId: string;
  clubId: string;
}) {
  const bound = createRosterPlayerAction.bind(null, teamId, clubId);
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
      <p className="text-sm font-medium">Add new player to squad</p>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_8rem_8rem_auto]">
        <div className="space-y-2">
          <Label htmlFor="new-player-first">First name</Label>
          <Input
            id="new-player-first"
            name="first_name"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-player-last">Last name</Label>
          <Input
            id="new-player-last"
            name="last_name"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-player-position">Position</Label>
          <NativeSelect
            id="new-player-position"
            name="position"
            disabled={pending}
          >
            <option value="">Optional</option>
            {PLAYER_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-player-shirt">Shirt</Label>
          <Input
            id="new-player-shirt"
            name="shirt_number"
            type="number"
            min={1}
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add player"}
        </Button>
      </div>
      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

function AddRosterPlayerForm({
  teamId,
  candidates,
}: {
  teamId: string;
  candidates: Player[];
}) {
  const bound = addRosterPlayerAction.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
    >
      <div className="space-y-2">
        <Label htmlFor="roster-player">Add existing club player</Label>
        <NativeSelect
          id="roster-player"
          name="player_id"
          required
          disabled={pending}
        >
          <option value="">Select a club player</option>
          {candidates.map((player) => (
            <option key={player.id} value={player.id}>
              {playerDisplayName(player)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roster-shirt">Shirt</Label>
        <Input
          id="roster-shirt"
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

function RosterRow({ entry }: { entry: RosterPlayer }) {
  const boundUpdate = updateRosterEntryAction.bind(
    null,
    entry.team_player_id,
    entry.id,
  );
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );
  const [removeState, removeAction, removePending] = useActionState(
    async () => removePlayerFromTeamAction(entry.team_player_id, entry.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/players/${entry.id}`}
          className="font-medium hover:underline"
        >
          {playerDisplayName(entry)}
        </Link>
        <span className="text-muted-foreground text-sm">
          {entry.position ?? "No position"}
        </span>
      </div>

      <form
        action={formAction}
        className="grid gap-3 sm:grid-cols-[8rem_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor={`shirt-${entry.team_player_id}`}>Shirt</Label>
          <Input
            id={`shirt-${entry.team_player_id}`}
            name="shirt_number"
            type="number"
            min={1}
            defaultValue={entry.shirt_number ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`active-${entry.team_player_id}`}>Squad status</Label>
          <NativeSelect
            id={`active-${entry.team_player_id}`}
            name="active"
            defaultValue={entry.active ? "true" : "false"}
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
          if (
            !window.confirm(
              "Remove this player from the squad? The player record and their goal history are kept.",
            )
          ) {
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
          {removePending ? "Removing…" : "Remove from squad"}
        </Button>
      </form>
    </div>
  );
}
