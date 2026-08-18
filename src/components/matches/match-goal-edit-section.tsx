"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  GOAL_KIND_LABELS,
  GOAL_KIND_VALUES,
  OPPOSITION_GOAL_LABEL,
  OPPOSITION_SCORER_VALUE,
  OWN_GOAL_LABEL,
  OWN_GOAL_SCORER_VALUE,
  type GoalKindValue,
} from "@/lib/constants";
import {
  createGoalAndReturnToMatchAction,
  saveGoalAndReturnToMatchAction,
} from "@/lib/goals/actions";
import { goalAssistsAllowed, goalKindFromFlags } from "@/lib/form-parse";
import { goalScorerLabel, playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import type { RosterPlayer } from "@/lib/data/players";
import { Input } from "@/components/ui/input";
import { Label, OptionalHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

export function MatchGoalEditSection({
  matchId,
  goal,
  players,
  periods,
  teamName,
  opponentName,
  canEdit = true,
  defaultPeriodId = null,
}: {
  matchId: string;
  goal?: GoalWithPlayers | null;
  players: RosterPlayer[];
  periods: MatchPeriodWithStarters[];
  teamName: string;
  opponentName: string;
  canEdit?: boolean;
  defaultPeriodId?: string | null;
}) {
  if (!canEdit) {
    if (!goal) return null;
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">Scorer</dt>
          <dd className="font-medium">{goalScorerLabel(goal)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Assist</dt>
          <dd className="font-medium">
            {goalAssistsAllowed(goal, goal)
              ? goal.assist
                ? playerDisplayName(goal.assist)
                : "None"
              : "—"}
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
          <dd className="font-medium">
            {GOAL_KIND_LABELS[goalKindFromFlags(goal)]}
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <EditableGoalSection
      matchId={matchId}
      goal={goal ?? null}
      players={players}
      periods={periods}
      teamName={teamName}
      opponentName={opponentName}
      defaultPeriodId={defaultPeriodId}
    />
  );
}

function defaultScorerValue(goal: GoalWithPlayers | null): string {
  if (!goal) return "";
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
  defaultPeriodId,
}: {
  matchId: string;
  goal: GoalWithPlayers | null;
  players: RosterPlayer[];
  periods: MatchPeriodWithStarters[];
  teamName: string;
  opponentName: string;
  defaultPeriodId: string | null;
}) {
  const fieldId = goal?.id ?? "new";
  const formId = `goal-details-${fieldId}`;
  const cancelHref = `/matches/${matchId}`;
  const bound = goal
    ? saveGoalAndReturnToMatchAction.bind(null, matchId, goal.id)
    : createGoalAndReturnToMatchAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const [scorerValue, setScorerValue] = useState(() =>
    defaultScorerValue(goal),
  );
  const [goalKind, setGoalKind] = useState<GoalKindValue>(() =>
    goalKindFromFlags(
      goal ?? { is_penalty: false, is_freekick: false, from_setpiece: false },
    ),
  );
  const assistsAllowed = goalAssistsAllowed(
    {
      is_opposition: scorerValue === OPPOSITION_SCORER_VALUE,
      is_own_goal: scorerValue === OWN_GOAL_SCORER_VALUE,
    },
    {
      is_penalty: goalKind === "penalty",
      is_freekick: goalKind === "freekick",
    },
  );

  const activePlayers = players.filter((p) => p.active);
  const options = activePlayers.length > 0 ? activePlayers : players;
  const optionIds = new Set(options.map((p) => p.id));
  const extra = players.filter(
    (p) =>
      !optionIds.has(p.id) &&
      (p.id === goal?.player_id || p.id === goal?.assist_player_id),
  );
  const playerOptions = [...options, ...extra];

  return (
    <div className="space-y-6">
      <form id={formId} action={formAction} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`player_id-${fieldId}`}>
              Scorer <span className="text-muted-foreground">(required)</span>
            </Label>
            <NativeSelect
              id={`player_id-${fieldId}`}
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
            <Label htmlFor={`assist-${fieldId}`}>
              Assist <OptionalHint />
            </Label>
            <NativeSelect
              id={`assist-${fieldId}`}
              name="assist_player_id"
              disabled={pending || !assistsAllowed}
              defaultValue={
                assistsAllowed ? (goal?.assist_player_id ?? "") : ""
              }
              key={assistsAllowed ? "assist-on" : "assist-off"}
            >
              <option value="">None</option>
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
            <Label htmlFor={`minute-${fieldId}`}>
              Minute <OptionalHint />
            </Label>
            <Input
              id={`minute-${fieldId}`}
              name="minute"
              type="number"
              min={0}
              max={120}
              defaultValue={goal?.minute ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`period-${fieldId}`}>
              Period <OptionalHint />
            </Label>
            <NativeSelect
              id={`period-${fieldId}`}
              name="period_id"
              disabled={pending}
              defaultValue={goal?.period_id ?? defaultPeriodId ?? ""}
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
            <legend className="text-sm font-medium">Type</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
              {GOAL_KIND_VALUES.map((kind) => (
                <label
                  key={kind}
                  className="flex min-h-9 items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="goal_kind"
                    value={kind}
                    checked={goalKind === kind}
                    onChange={() => setGoalKind(kind)}
                    disabled={pending}
                    className="border-input size-4"
                  />
                  {GOAL_KIND_LABELS[kind]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {state.error ? <ErrorBanner message={state.error} /> : null}
      </form>

      <FormActions pending={pending} cancelHref={cancelHref} form={formId} />
    </div>
  );
}
