"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { AGE_GROUPS } from "@/lib/constants";
import {
  archiveTeamAction,
  startNewSeasonAction,
  unarchiveTeamAction,
} from "@/lib/team/actions";
import {
  isTeamArchived,
  nextSeasonLabel,
  suggestNextAgeGroup,
} from "@/lib/team/season";
import type { Team } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SeasonInput } from "@/components/team/season-input";

type TransitionMode = "continue" | "archive_only";

export function TeamSeasonArchiveSection({ team }: { team: Team }) {
  const archived = isTeamArchived(team);
  const [mode, setMode] = useState<TransitionMode>("continue");
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

  const defaultSeason = nextSeasonLabel(team.season_label) ?? team.season_label;
  const defaultAgeGroup = String(suggestNextAgeGroup(team.age_group));
  const showContinue = archived || mode === "continue";

  return (
    <div className="space-y-6">
      {!archived ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">
            What do you want to do?
          </legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name="transition_mode"
              value="continue"
              checked={mode === "continue"}
              disabled={startPending || archivePending}
              onChange={() => setMode("continue")}
              className="border-input mt-1 size-4"
            />
            <span>
              <span className="font-medium">Continue into a new season</span>
              <span className="text-muted-foreground block">
                Archive {team.season_label} and create a successor. Use this to
                roll an age group forward (e.g. U10 → U11) or open a fresh squad
                for the same age group.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="radio"
              name="transition_mode"
              value="archive_only"
              checked={mode === "archive_only"}
              disabled={startPending || archivePending}
              onChange={() => setMode("archive_only")}
              className="border-input mt-1 size-4"
            />
            <span>
              <span className="font-medium">Archive only</span>
              <span className="text-muted-foreground block">
                Keep {team.season_label} as history without creating a new team.
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      {showContinue ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              {archived ? "Open next season" : "New season details"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {archived
                ? `Create a successor from this archived ${team.season_label} record. Matches stay on the archived season.`
                : `Archives ${team.season_label} and opens the next season. Matches stay on the archived record.`}
            </p>
          </div>
          <form action={startAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-season-label">Season</Label>
                <SeasonInput
                  id="new-season-label"
                  name="season_label"
                  defaultValue={defaultSeason}
                  required
                  disabled={startPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-age-group">Age group</Label>
                <NativeSelect
                  id="new-age-group"
                  name="age_group"
                  required
                  defaultValue={defaultAgeGroup}
                  disabled={startPending}
                >
                  {(AGE_GROUPS.includes(
                    defaultAgeGroup as (typeof AGE_GROUPS)[number],
                  )
                    ? AGE_GROUPS
                    : [defaultAgeGroup, ...AGE_GROUPS]
                  ).map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-team-name">Team name</Label>
                <Input
                  id="new-team-name"
                  name="name"
                  required
                  defaultValue={team.name}
                  disabled={startPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-display-name">
                  Display name <OptionalHint />
                </Label>
                <Input
                  id="new-display-name"
                  name="display_name"
                  defaultValue={team.display_name ?? ""}
                  disabled={startPending}
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Carry over</legend>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="migrate_players"
                  defaultChecked
                  disabled={startPending}
                  className="border-input size-4 rounded"
                />
                Migrate squad (players and shirt numbers)
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="migrate_coaches"
                  defaultChecked
                  disabled={startPending}
                  className="border-input size-4 rounded"
                />
                Migrate coaching staff
              </label>
              <p className="text-muted-foreground text-xs">
                Uncheck squad to start a fresh team for the same age group. App
                access for coaches and management always carries over.
              </p>
            </fieldset>

            {startState.error ? (
              <ErrorBanner message={startState.error} />
            ) : null}
            <Button type="submit" disabled={startPending}>
              {startPending
                ? "Starting…"
                : archived
                  ? "Create next season"
                  : "Archive and start new season"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Archive this season</h3>
            <p className="text-muted-foreground text-sm">
              Keep {team.season_label} as a historical record. Matches, scorers,
              and squad stay attached. You can open a successor later.
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
        </div>
      )}

      {archived ? (
        <div className="border-border space-y-3 border-t pt-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Restore season</h3>
            <p className="text-muted-foreground text-sm">
              Mark {team.season_label} as a current season again. Use this if it
              was archived by mistake.
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
        </div>
      ) : null}
    </div>
  );
}
