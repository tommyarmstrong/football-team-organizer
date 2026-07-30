"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  OPPOSITION_GOAL_LABEL,
  OPPOSITION_SCORER_VALUE,
} from "@/lib/constants";
import {
  deleteGoalAndReturnToMatchAction,
  saveGoalAndReturnToMatchAction,
} from "@/lib/goals/actions";
import { goalScorerLabel, playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchGoalEditSection({
  matchId,
  goal,
  players,
  periods,
  teamName,
  opponentName,
  canEdit = true,
}: {
  matchId: string;
  goal: GoalWithPlayers;
  players: RosterPlayer[];
  periods: MatchPeriodWithStarters[];
  teamName: string;
  opponentName: string;
  canEdit?: boolean;
}) {
  if (!canEdit) {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Scorer</dt>
          <dd className="font-medium">{goalScorerLabel(goal)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Assist</dt>
          <dd className="font-medium">
            {goal.is_opposition
              ? "—"
              : goal.assist
                ? playerDisplayName(goal.assist)
                : "None"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Minute</dt>
          <dd className="font-medium">
            {goal.minute != null ? `${goal.minute}'` : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Period</dt>
          <dd className="font-medium">{goal.period ?? "—"}</dd>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-muted-foreground">Flags</dt>
          <dd className="font-medium">
            {[
              goal.is_penalty ? "Penalty" : null,
              goal.is_freekick ? "Free kick" : null,
              goal.from_setpiece ? "Set piece" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "None"}
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <EditableGoalSection
      matchId={matchId}
      goal={goal}
      players={players}
      periods={periods}
      teamName={teamName}
      opponentName={opponentName}
    />
  );
}

function EditableGoalSection({
  matchId,
  goal,
  players,
  periods,
  teamName,
  opponentName,
}: {
  matchId: string;
  goal: GoalWithPlayers;
  players: RosterPlayer[];
  periods: MatchPeriodWithStarters[];
  teamName: string;
  opponentName: string;
}) {
  const formId = `goal-details-${goal.id}`;
  const bound = saveGoalAndReturnToMatchAction.bind(null, matchId, goal.id);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const activePlayers = players.filter((p) => p.active);
  const options = activePlayers.length > 0 ? activePlayers : players;
  const optionIds = new Set(options.map((p) => p.id));
  const extra = players.filter(
    (p) =>
      !optionIds.has(p.id) &&
      (p.id === goal.player_id || p.id === goal.assist_player_id),
  );
  const playerOptions = [...options, ...extra];
  const defaultScorer = goal.is_opposition
    ? OPPOSITION_SCORER_VALUE
    : (goal.player_id ?? "");

  return (
    <div className="space-y-6">
      <form id={formId} action={formAction} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`player_id-${goal.id}`}>
              Scorer <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id={`player_id-${goal.id}`}
              name="player_id"
              required
              disabled={pending}
              defaultValue={defaultScorer}
            >
              <option value="" disabled>
                Select scorer
              </option>
              {playerOptions.length > 0 ? (
                <optgroup label={teamName}>
                  {playerOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerDisplayName(p, { shirtNumber: p.shirt_number })}
                      {!p.active ? " (inactive)" : ""}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label={opponentName || "Opposition"}>
                <option value={OPPOSITION_SCORER_VALUE}>
                  {OPPOSITION_GOAL_LABEL}
                </option>
              </optgroup>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assist-${goal.id}`}>Assist (optional)</Label>
            <NativeSelect
              id={`assist-${goal.id}`}
              name="assist_player_id"
              disabled={pending}
              defaultValue={goal.assist_player_id ?? ""}
            >
              <option value="">None</option>
              {playerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerDisplayName(p, { shirtNumber: p.shirt_number })}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`minute-${goal.id}`}>Minute</Label>
            <Input
              id={`minute-${goal.id}`}
              name="minute"
              type="number"
              min={0}
              max={120}
              defaultValue={goal.minute ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`period-${goal.id}`}>Period</Label>
            <NativeSelect
              id={`period-${goal.id}`}
              name="period_id"
              disabled={pending}
              defaultValue={goal.period_id ?? ""}
            >
              <option value="">None</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_penalty"
              defaultChecked={goal.is_penalty}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            Penalty
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_freekick"
              defaultChecked={goal.is_freekick}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            Free kick
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="from_setpiece"
              defaultChecked={goal.from_setpiece}
              disabled={pending}
              className="border-input size-4 rounded"
            />
            From set piece
          </label>
        </div>
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? "Saving…" : "Back to match"}
        </Button>
        <DeleteGoalForm matchId={matchId} goalId={goal.id} />
      </div>
    </div>
  );
}

function DeleteGoalForm({
  matchId,
  goalId,
}: {
  matchId: string;
  goalId: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => deleteGoalAndReturnToMatchAction(matchId, goalId),
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Remove this goal?")) {
          event.preventDefault();
        }
      }}
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Removing…" : "Remove goal"}
      </Button>
    </form>
  );
}
