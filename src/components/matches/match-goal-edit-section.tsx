"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  GOAL_KIND_LABELS,
  OPPOSITION_GOAL_LABEL,
  OPPOSITION_SCORER_VALUE,
  OWN_GOAL_LABEL,
  OWN_GOAL_SCORER_VALUE,
} from "@/lib/constants";
import {
  deleteGoalAndReturnToMatchAction,
  saveGoalAndReturnToMatchAction,
} from "@/lib/goals/actions";
import { goalKindFromFlags } from "@/lib/form-parse";
import {
  goalKindLabel,
  goalScorerLabel,
  playerDisplayName,
} from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

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
            {goal.is_opposition || goal.is_own_goal
              ? "—"
              : goal.assist
                ? playerDisplayName(goal.assist)
                : "None"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Minute</dt>
          <dd className="font-medium">
            {goal.minute != null ? `'${goal.minute}` : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Period</dt>
          <dd className="font-medium">{goal.period ?? "—"}</dd>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">{goalKindLabel(goal) ?? "None"}</dd>
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

function defaultScorerValue(goal: GoalWithPlayers): string {
  if (goal.is_own_goal) return OWN_GOAL_SCORER_VALUE;
  if (goal.is_opposition) return OPPOSITION_SCORER_VALUE;
  return goal.player_id ?? "";
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

  const [scorerValue, setScorerValue] = useState(() =>
    defaultScorerValue(goal),
  );
  const assistsAllowed =
    scorerValue !== OPPOSITION_SCORER_VALUE &&
    scorerValue !== OWN_GOAL_SCORER_VALUE;

  const activePlayers = players.filter((p) => p.active);
  const options = activePlayers.length > 0 ? activePlayers : players;
  const optionIds = new Set(options.map((p) => p.id));
  const extra = players.filter(
    (p) =>
      !optionIds.has(p.id) &&
      (p.id === goal.player_id || p.id === goal.assist_player_id),
  );
  const playerOptions = [...options, ...extra];
  const defaultKind = goalKindFromFlags(goal);

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
              value={scorerValue}
              onChange={(event) => setScorerValue(event.target.value)}
            >
              <option value="" disabled>
                Select scorer
              </option>
              <optgroup label={teamName}>
                {playerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {playerDisplayName(p, { shirtNumber: p.shirt_number })}
                    {!p.active ? " (inactive)" : ""}
                  </option>
                ))}
                <option value={OWN_GOAL_SCORER_VALUE}>{OWN_GOAL_LABEL}</option>
              </optgroup>
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
              disabled={pending || !assistsAllowed}
              defaultValue={assistsAllowed ? (goal.assist_player_id ?? "") : ""}
              key={assistsAllowed ? "assist-on" : "assist-off"}
            >
              <option value="">
                {assistsAllowed ? "None" : "Not available"}
              </option>
              {assistsAllowed
                ? playerOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerDisplayName(p, { shirtNumber: p.shirt_number })}
                    </option>
                  ))
                : null}
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
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">Type (optional)</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="goal_kind"
                  value="none"
                  defaultChecked={defaultKind === "none"}
                  disabled={pending}
                  className="border-input size-4"
                />
                None
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="goal_kind"
                  value="penalty"
                  defaultChecked={defaultKind === "penalty"}
                  disabled={pending}
                  className="border-input size-4"
                />
                {GOAL_KIND_LABELS.penalty}
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="goal_kind"
                  value="freekick"
                  defaultChecked={defaultKind === "freekick"}
                  disabled={pending}
                  className="border-input size-4"
                />
                {GOAL_KIND_LABELS.freekick}
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="goal_kind"
                  value="setpiece"
                  defaultChecked={defaultKind === "setpiece"}
                  disabled={pending}
                  className="border-input size-4"
                />
                {GOAL_KIND_LABELS.setpiece}
              </label>
            </div>
          </fieldset>
        </div>
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <ListDeleteButton
          label="Remove goal"
          confirmMessage="Remove this goal?"
          deleteAction={() =>
            deleteGoalAndReturnToMatchAction(matchId, goal.id)
          }
        />
      </div>
    </div>
  );
}
