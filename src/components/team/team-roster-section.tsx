"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { addRosterPlayerAction } from "@/lib/players/actions";
import { playerDisplayName } from "@/lib/format";
import type { Player } from "@/lib/supabase/database.types";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SearchableSelect } from "@/components/shared/searchable-select";

export function TeamRosterSection({
  teamId,
  roster,
  candidates,
  canEdit,
}: {
  teamId: string;
  roster: RosterPlayer[];
  candidates: Player[];
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
        <ul className="divide-border border-border divide-y rounded-xl border">
          {roster.map((entry) => (
            <li key={entry.team_player_id}>
              <Link
                href={`/players/${entry.id}`}
                className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center gap-3 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                <span className="text-muted-foreground shrink-0">
                  {entry.active ? "Active" : "Inactive"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
  candidates: Player[];
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
