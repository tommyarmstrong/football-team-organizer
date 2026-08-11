"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  archiveTeamAction,
  startNewSeasonAction,
  unarchiveTeamAction,
} from "@/lib/team/actions";
import { isTeamArchived } from "@/lib/team/season";
import type { Team } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SeasonInput } from "@/components/team/season-input";

export function TeamSeasonArchiveSection({ team }: { team: Team }) {
  const archived = isTeamArchived(team);
  const [startState, startAction, startPending] = useActionState(
    startNewSeasonAction,
    INITIAL_ACTION_STATE,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveTeamAction,
    INITIAL_ACTION_STATE,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    unarchiveTeamAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            {archived ? "Open next season" : "Start new season"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {archived
              ? `Create a new ${team.name} season from this archived record. Matches and squad stay on ${team.season_label}.`
              : `Archive ${team.season_label} as a historical record and open a fresh ${team.name} season. Matches and squad stay on the archived season; coaching staff carry over.`}
          </p>
        </div>
        <form action={startAction} className="space-y-3">
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="new-season-label">New season</Label>
            <SeasonInput
              id="new-season-label"
              name="season_label"
              required
              disabled={startPending}
            />
          </div>
          {startState.error ? <ErrorBanner message={startState.error} /> : null}
          <Button type="submit" disabled={startPending}>
            {startPending
              ? "Starting…"
              : archived
                ? "Create next season"
                : "Archive and start new season"}
          </Button>
        </form>
      </div>

      <div className="border-border space-y-3 border-t pt-6">
        {archived ? (
          <>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Restore season</h3>
              <p className="text-muted-foreground text-sm">
                Mark {team.season_label} as a current season again. Use this if
                it was archived by mistake.
              </p>
            </div>
            {restoreState.error ? (
              <ErrorBanner message={restoreState.error} />
            ) : null}
            {restoreState.success ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {restoreState.success}
              </p>
            ) : null}
            <form action={restoreAction}>
              <Button type="submit" variant="outline" disabled={restorePending}>
                {restorePending ? "Restoring…" : "Restore this season"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Archive this season</h3>
              <p className="text-muted-foreground text-sm">
                Keep {team.season_label} as a read-available historical record
                without opening a new season yet. Matches, scorers, and squad
                stay attached.
              </p>
            </div>
            {archiveState.error ? (
              <ErrorBanner message={archiveState.error} />
            ) : null}
            {archiveState.success ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                {archiveState.success}
              </p>
            ) : null}
            <form
              action={archiveAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    `Archive ${team.name} · ${team.season_label}? Historical data will remain available.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <Button type="submit" variant="outline" disabled={archivePending}>
                {archivePending ? "Archiving…" : "Archive season"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
