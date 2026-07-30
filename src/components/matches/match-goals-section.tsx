"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  createGoalAction,
  deleteGoalAction,
  updateGoalAction,
} from "@/lib/goals/actions";
import { playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

export function MatchGoalsSection({
  matchId,
  goals,
  players,
  canEdit = true,
  periodId = null,
  periodName = null,
  showPeriodField = true,
}: {
  matchId: string;
  goals: GoalWithPlayers[];
  players: RosterPlayer[];
  canEdit?: boolean;
  /** When set, new/edited goals are linked to this period and the label is auto-filled. */
  periodId?: string | null;
  periodName?: string | null;
  showPeriodField?: boolean;
}) {
  if (!canEdit) {
    return goals.length === 0 ? (
      <EmptyState
        title="No goals recorded"
        description="Goals scored by our players will appear here."
      />
    ) : (
      <ul className="divide-border border-border divide-y rounded-xl border">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="font-medium">
              {playerDisplayName(goal.scorer)}
            </span>
            <span className="text-muted-foreground">
              {goal.minute != null ? `${goal.minute}'` : ""}
              {goal.is_penalty ? " · Pen" : ""}
              {!periodId && goal.period ? ` · ${goal.period}` : ""}
              {goal.assist ? ` · assist ${playerDisplayName(goal.assist)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AddGoalForm
        matchId={matchId}
        players={players}
        periodId={periodId}
        periodName={periodName}
        showPeriodField={showPeriodField}
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals recorded"
          description={
            periodId
              ? "Add goals scored in this period."
              : "Add goals scored by our players. Opposition scorers are not tracked — use goals against on the match score."
          }
        />
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => (
            <li key={goal.id} className="border-border rounded-xl border p-4">
              <GoalRow
                matchId={matchId}
                goal={goal}
                players={players}
                periodId={periodId ?? goal.period_id}
                periodName={periodName ?? goal.period}
                showPeriodField={showPeriodField && !periodId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddGoalForm({
  matchId,
  players,
  periodId,
  periodName,
  showPeriodField,
}: {
  matchId: string;
  players: RosterPlayer[];
  periodId: string | null;
  periodName: string | null;
  showPeriodField: boolean;
}) {
  const bound = createGoalAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  if (players.length === 0) {
    return (
      <EmptyState
        title="No players available"
        description="Select the match-day squad (or add team roster players) before recording goals."
      />
    );
  }

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="border-border space-y-3 rounded-xl border p-4"
    >
      <p className="text-sm font-medium">Add goal</p>
      {periodId ? (
        <input type="hidden" name="period_id" value={periodId} />
      ) : null}
      <GoalFields
        players={players}
        pending={pending}
        showPeriodField={showPeriodField}
        defaults={{
          period: periodName,
          period_id: periodId,
        }}
      />
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add goal"}
      </Button>
    </form>
  );
}

function GoalRow({
  matchId,
  goal,
  players,
  periodId,
  periodName,
  showPeriodField,
}: {
  matchId: string;
  goal: GoalWithPlayers;
  players: RosterPlayer[];
  periodId: string | null;
  periodName: string | null;
  showPeriodField: boolean;
}) {
  const boundUpdate = updateGoalAction.bind(null, matchId, goal.id);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    INITIAL_ACTION_STATE,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async () => deleteGoalAction(matchId, goal.id),
    INITIAL_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        {periodId ? (
          <input type="hidden" name="period_id" value={periodId} />
        ) : null}
        <GoalFields
          players={players}
          pending={pending}
          showPeriodField={showPeriodField}
          defaults={{
            player_id: goal.player_id,
            assist_player_id: goal.assist_player_id,
            minute: goal.minute,
            period: periodName ?? goal.period,
            period_id: periodId ?? goal.period_id,
            is_penalty: goal.is_penalty,
            is_freekick: goal.is_freekick,
            from_setpiece: goal.from_setpiece,
          }}
        />
        {state.error ? <ErrorBanner message={state.error} /> : null}
        {state.success ? (
          <p className="text-muted-foreground text-sm" role="status">
            {state.success}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
      <form
        action={deleteAction}
        className="space-y-2"
        onSubmit={(event) => {
          if (!window.confirm("Remove this goal?")) {
            event.preventDefault();
          }
        }}
      >
        {deleteState.error ? <ErrorBanner message={deleteState.error} /> : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={deletePending}
        >
          {deletePending ? "Removing…" : "Remove goal"}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Current: {playerDisplayName(goal.scorer)}
        {goal.minute != null ? ` ${goal.minute}'` : ""}
        {goal.is_penalty ? " (pen)" : ""}
      </p>
    </div>
  );
}

function GoalFields({
  players,
  pending,
  defaults,
  showPeriodField = true,
}: {
  players: RosterPlayer[];
  pending: boolean;
  showPeriodField?: boolean;
  defaults?: {
    player_id?: string;
    assist_player_id?: string | null;
    minute?: number | null;
    period?: string | null;
    period_id?: string | null;
    is_penalty?: boolean;
    is_freekick?: boolean;
    from_setpiece?: boolean;
  };
}) {
  const activePlayers = players.filter((p) => p.active);
  const options = activePlayers.length > 0 ? activePlayers : players;

  // Ensure current scorer/assist still appear even if inactive
  const optionIds = new Set(options.map((p) => p.id));
  const extra = players.filter(
    (p) =>
      !optionIds.has(p.id) &&
      (p.id === defaults?.player_id || p.id === defaults?.assist_player_id),
  );
  const playerOptions = [...options, ...extra];
  const fieldKey = defaults?.player_id ?? defaults?.period_id ?? "new";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`player_id-${fieldKey}`}>
          Scorer <span className="text-muted-foreground">(required)</span>
        </Label>
        <NativeSelect
          id={`player_id-${fieldKey}`}
          name="player_id"
          required
          aria-required="true"
          defaultValue={defaults?.player_id ?? ""}
          disabled={pending}
        >
          <option value="" disabled>
            Select player
          </option>
          {playerOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {playerDisplayName(p, { shirtNumber: p.shirt_number })}
              {!p.active ? " (inactive)" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`assist-${fieldKey}`}>Assist (optional)</Label>
        <NativeSelect
          id={`assist-${fieldKey}`}
          name="assist_player_id"
          defaultValue={defaults?.assist_player_id ?? ""}
          disabled={pending}
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
        <Label htmlFor={`minute-${fieldKey}`}>Minute</Label>
        <Input
          id={`minute-${fieldKey}`}
          name="minute"
          type="number"
          min={0}
          max={120}
          defaultValue={defaults?.minute ?? ""}
          disabled={pending}
        />
      </div>
      {showPeriodField ? (
        <div className="space-y-2">
          <Label htmlFor={`period-${fieldKey}`}>Period</Label>
          <Input
            id={`period-${fieldKey}`}
            name="period"
            placeholder="e.g. 1st half"
            defaultValue={defaults?.period ?? ""}
            disabled={pending}
          />
        </div>
      ) : defaults?.period ? (
        <div className="space-y-2">
          <Label>Period</Label>
          <p className="text-sm font-medium">{defaults.period}</p>
        </div>
      ) : null}
      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_penalty"
          defaultChecked={defaults?.is_penalty}
          disabled={pending}
          className="border-input size-4 rounded"
        />
        Penalty
      </label>
      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_freekick"
          defaultChecked={defaults?.is_freekick}
          disabled={pending}
          className="border-input size-4 rounded"
        />
        Free-kick
      </label>
      <label className="flex min-h-9 items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="from_setpiece"
          defaultChecked={defaults?.from_setpiece}
          disabled={pending}
          className="border-input size-4 rounded"
        />
        From set piece
      </label>
    </div>
  );
}
