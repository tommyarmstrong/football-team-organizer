"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  OPPOSITION_GOAL_LABEL,
  OPPOSITION_SCORER_VALUE,
} from "@/lib/constants";
import { createGoalAction, deleteGoalAction } from "@/lib/goals/actions";
import { goalScorerLabel, playerDisplayName } from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";

function goalKindLabels(goal: GoalWithPlayers): string[] {
  const labels: string[] = [];
  if (goal.is_penalty) labels.push("Penalty");
  if (goal.is_freekick) labels.push("Free kick");
  if (goal.from_setpiece) labels.push("Set piece");
  return labels;
}

export function goalChipClassName(
  isOpposition: boolean,
  className?: string,
): string {
  return cn(
    "bg-background inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium",
    isOpposition ? "border-red-500/80" : "border-emerald-600/80",
    className,
  );
}

export function GoalScorerChip({
  goal,
  className,
}: {
  goal: GoalWithPlayers;
  className?: string;
}) {
  return (
    <span className={goalChipClassName(goal.is_opposition, className)}>
      <span aria-hidden="true">⚽</span>
      <span className="truncate">{goalScorerLabel(goal)}</span>
    </span>
  );
}

export function MatchGoalsSection({
  matchId,
  goals,
  players,
  teamName,
  opponentName,
  canEdit = true,
  periodId = null,
}: {
  matchId: string;
  goals: GoalWithPlayers[];
  players: RosterPlayer[];
  teamName: string;
  opponentName: string;
  canEdit?: boolean;
  /** When set, new goals are linked to this period. */
  periodId?: string | null;
}) {
  if (!canEdit && goals.length === 0) {
    return (
      <EmptyState
        title="No goals recorded"
        description="Goals scored by our team or the opposition will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <EmptyState
          title="No goals recorded"
          description={
            periodId
              ? "Add a goal below for this period."
              : "Add a goal below, then set details on the goal page."
          }
        />
      ) : (
        <ul className="divide-border border-border divide-y rounded-xl border">
          {goals.map((goal) => {
            const kinds = goalKindLabels(goal);
            return (
              <li key={goal.id} className="flex items-stretch">
                <Link
                  href={`/matches/${matchId}/goals/${goal.id}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <GoalScorerChip goal={goal} />
                  {kinds.map((label) => (
                    <span
                      key={label}
                      className="text-muted-foreground text-xs font-medium"
                    >
                      {label}
                    </span>
                  ))}
                  {goal.assist ? (
                    <span className="text-muted-foreground text-xs">
                      Assist: {playerDisplayName(goal.assist)}
                    </span>
                  ) : null}
                  {goal.period ? (
                    <span className="text-muted-foreground text-xs">
                      {goal.period}
                    </span>
                  ) : null}
                  {goal.minute != null ? (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {goal.minute}&apos;
                    </span>
                  ) : null}
                </Link>
                {canEdit ? (
                  <div className="flex items-center pr-2">
                    <ListDeleteButton
                      label={`Delete goal by ${goalScorerLabel(goal)}`}
                      confirmMessage="Remove this goal?"
                      deleteAction={() => deleteGoalAction(matchId, goal.id)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? (
        <AddGoalForm
          matchId={matchId}
          players={players}
          teamName={teamName}
          opponentName={opponentName}
          periodId={periodId}
        />
      ) : null}
    </div>
  );
}

function AddGoalForm({
  matchId,
  players,
  teamName,
  opponentName,
  periodId,
}: {
  matchId: string;
  players: RosterPlayer[];
  teamName: string;
  opponentName: string;
  periodId: string | null;
}) {
  const bound = createGoalAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  const activePlayers = players.filter((p) => p.active);
  const playerOptions = activePlayers.length > 0 ? activePlayers : players;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      {periodId ? (
        <input type="hidden" name="period_id" value={periodId} />
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={`add-goal-player-${periodId ?? "match"}`}>
          Add goal
        </Label>
        <NativeSelect
          id={`add-goal-player-${periodId ?? "match"}`}
          name="player_id"
          required
          disabled={pending}
          defaultValue=""
        >
          <option value="" disabled>
            Select scorer
          </option>
          {playerOptions.length > 0 ? (
            <optgroup label={teamName}>
              {playerOptions.map((player) => (
                <option key={player.id} value={player.id}>
                  {playerDisplayName(player, {
                    shirtNumber: player.shirt_number,
                  })}
                  {!player.active ? " (inactive)" : ""}
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
