"use client";

import { XIcon } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { MATCH_PERIOD_NAMES, isMatchPeriodName } from "@/lib/constants";
import {
  deletePeriodAndReturnToMatchAction,
  savePeriodAndReturnToMatchAction,
  savePeriodStartersAction,
} from "@/lib/match-periods/actions";
import { playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import type { RosterPlayer } from "@/lib/data/players";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchPeriodEditSection({
  matchId,
  period,
  goals,
  squadPlayers,
  teamName,
  opponentName,
  canEdit = true,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  goals: GoalWithPlayers[];
  squadPlayers: RosterPlayer[];
  teamName: string;
  opponentName: string;
  canEdit?: boolean;
}) {
  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Period</p>
          <p className="font-medium">{period.name}</p>
        </div>
        <PeriodStarters
          matchId={matchId}
          period={period}
          squadPlayers={squadPlayers}
          canEdit={false}
        />
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Goals</h3>
          <MatchGoalsSection
            matchId={matchId}
            goals={goals}
            players={squadPlayers}
            teamName={teamName}
            opponentName={opponentName}
            canEdit={false}
            periodId={period.id}
          />
        </div>
      </div>
    );
  }

  return (
    <EditablePeriodSection
      matchId={matchId}
      period={period}
      goals={goals}
      squadPlayers={squadPlayers}
      teamName={teamName}
      opponentName={opponentName}
    />
  );
}

function EditablePeriodSection({
  matchId,
  period,
  goals,
  squadPlayers,
  teamName,
  opponentName,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  goals: GoalWithPlayers[];
  squadPlayers: RosterPlayer[];
  teamName: string;
  opponentName: string;
}) {
  const formId = `period-details-${period.id}`;
  const bound = savePeriodAndReturnToMatchAction.bind(null, matchId, period.id);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const knownName = isMatchPeriodName(period.name);

  return (
    <div className="space-y-6">
      <form id={formId} action={formAction} className="space-y-2">
        <Label htmlFor={`period-name-${period.id}`}>Period</Label>
        <NativeSelect
          id={`period-name-${period.id}`}
          name="name"
          required
          disabled={pending}
          defaultValue={knownName ? period.name : ""}
        >
          {!knownName ? (
            <option value="" disabled>
              Select period type…
            </option>
          ) : null}
          {MATCH_PERIOD_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </NativeSelect>
        {!knownName ? (
          <p className="text-muted-foreground text-sm">
            “{period.name}” is an old label — choose a period type before going
            back.
          </p>
        ) : null}
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>
      <PeriodStarters
        matchId={matchId}
        period={period}
        squadPlayers={squadPlayers}
        canEdit
      />
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Goals</h3>
        <MatchGoalsSection
          matchId={matchId}
          goals={goals}
          players={squadPlayers}
          teamName={teamName}
          opponentName={opponentName}
          canEdit
          periodId={period.id}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? "Saving…" : "Back to match"}
        </Button>
        <DeletePeriodForm matchId={matchId} periodId={period.id} />
      </div>
    </div>
  );
}

function DeletePeriodForm({
  matchId,
  periodId,
}: {
  matchId: string;
  periodId: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => deletePeriodAndReturnToMatchAction(matchId, periodId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Remove this period? Goals linked to it will keep their text label but lose the period link.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Removing…" : "Remove period"}
      </Button>
    </form>
  );
}

function PeriodStarters({
  matchId,
  period,
  squadPlayers,
  canEdit,
}: {
  matchId: string;
  period: MatchPeriodWithStarters;
  squadPlayers: RosterPlayer[];
  canEdit: boolean;
}) {
  const selected = new Set(period.starter_player_ids);
  const selectedPlayers = squadPlayers.filter((p) => selected.has(p.id));

  if (!canEdit) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Starting players</h3>
        {selectedPlayers.length === 0 ? (
          <p className="text-muted-foreground text-sm">None selected.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <li
                key={player.id}
                className="border-border bg-background inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium"
              >
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (squadPlayers.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Starting players</h3>
        <EmptyState
          title="No players available"
          description="Select the match-day squad first, then choose who starts this period."
        />
      </div>
    );
  }

  return (
    <StartersForm
      key={period.starter_player_ids.slice().sort().join(",")}
      matchId={matchId}
      periodId={period.id}
      squadPlayers={squadPlayers}
      selectedPlayerIds={period.starter_player_ids}
    />
  );
}

function StartersForm({
  matchId,
  periodId,
  squadPlayers,
  selectedPlayerIds,
}: {
  matchId: string;
  periodId: string;
  squadPlayers: RosterPlayer[];
  selectedPlayerIds: string[];
}) {
  const bound = savePeriodStartersAction.bind(null, matchId, periodId);
  const [state, formAction, actionPending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState(selectedPlayerIds);

  const selected = new Set(selectedIds);
  const selectedPlayers = squadPlayers.filter((p) => selected.has(p.id));
  const availablePlayers = squadPlayers.filter((p) => !selected.has(p.id));
  const isPending = pending || actionPending;

  function persist(nextIds: string[]) {
    setSelectedIds(nextIds);
    const formData = new FormData();
    for (const id of nextIds) {
      formData.append("player_id", id);
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  function removePlayer(playerId: string) {
    persist(selectedIds.filter((id) => id !== playerId));
  }

  function addPlayer(playerId: string) {
    if (!playerId || selected.has(playerId)) return;
    persist([...selectedIds, playerId]);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Starting players</h3>
      <p className="text-muted-foreground text-xs">
        Players who start this period are assumed to complete it. Remove a
        player to deselect them, or add them back below.
      </p>

      {selectedPlayers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No starting players selected.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <li
              key={player.id}
              className="border-border bg-background inline-flex items-center gap-1 rounded-lg border py-1 pr-1 pl-2.5 text-sm font-medium"
            >
              <span>
                {playerDisplayName(player, {
                  shirtNumber: player.shirt_number,
                })}
              </span>
              <button
                type="button"
                onClick={() => removePlayer(player.id)}
                disabled={isPending}
                aria-label={`Remove ${playerDisplayName(player)} from starting players`}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor={`add_period_starter_${periodId}`}>Add player</Label>
        <NativeSelect
          id={`add_period_starter_${periodId}`}
          value=""
          disabled={isPending || availablePlayers.length === 0}
          onChange={(e) => addPlayer(e.target.value)}
        >
          <option value="">
            {availablePlayers.length === 0
              ? "All available players selected"
              : "Select a player to add…"}
          </option>
          {availablePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {playerDisplayName(player, {
                shirtNumber: player.shirt_number,
              })}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
