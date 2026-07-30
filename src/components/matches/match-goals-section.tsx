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
}: {
  matchId: string;
  goals: GoalWithPlayers[];
  players: RosterPlayer[];
  canEdit?: boolean;
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
              {goal.assist ? ` · assist ${playerDisplayName(goal.assist)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AddGoalForm matchId={matchId} players={players} />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals recorded"
          description="Add goals scored by our players. Opposition scorers are not tracked — use goals against on the match score."
        />
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => (
            <li key={goal.id} className="border-border rounded-xl border p-4">
              <GoalRow matchId={matchId} goal={goal} players={players} />
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
}: {
  matchId: string;
  players: RosterPlayer[];
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
        description="Add squad players before recording goals."
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
      <GoalFields players={players} pending={pending} />
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
}: {
  matchId: string;
  goal: GoalWithPlayers;
  players: RosterPlayer[];
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
        <GoalFields
          players={players}
          pending={pending}
          defaults={{
            player_id: goal.player_id,
            assist_player_id: goal.assist_player_id,
            minute: goal.minute,
            period: goal.period,
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
}: {
  players: RosterPlayer[];
  pending: boolean;
  defaults?: {
    player_id?: string;
    assist_player_id?: string | null;
    minute?: number | null;
    period?: string | null;
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
  const fieldKey = defaults?.player_id ?? "new";

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
