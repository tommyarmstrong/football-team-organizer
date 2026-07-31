"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import {
  OPPOSITION_GOAL_LABEL,
  OPPOSITION_SCORER_VALUE,
  OWN_GOAL_LABEL,
  OWN_GOAL_SCORER_VALUE,
} from "@/lib/constants";
import { createGoalAction, deleteGoalAction } from "@/lib/goals/actions";
import {
  formatGoalMinute,
  goalKindLabel,
  goalScorerLabel,
  playerDisplayName,
} from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { SearchableSelect } from "@/components/shared/searchable-select";

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

export function GoalAssistChip({
  player,
  className,
}: {
  player: { first_name: string; last_name: string };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-background inline-flex items-center gap-1.5 rounded-lg border border-amber-400/90 px-2.5 py-1 font-medium",
        className,
      )}
    >
      <span aria-hidden="true">🤝</span>
      <span className="truncate">{playerDisplayName(player)}</span>
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
        <ul className={objectListClassName}>
          {goals.map((goal) => {
            const kind = goalKindLabel(goal);
            const minuteLabel = formatGoalMinute(goal.minute);
            return (
              <li key={goal.id} className="flex items-stretch">
                <Link
                  href={`/matches/${matchId}/goals/${goal.id}`}
                  className={objectListRowClassName()}
                >
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                    <GoalScorerChip goal={goal} />
                    {goal.assist && !goal.is_own_goal && !goal.is_opposition ? (
                      <GoalAssistChip player={goal.assist} />
                    ) : null}
                    {kind ? (
                      <span className="text-muted-foreground shrink-0 text-xs font-medium">
                        {kind}
                      </span>
                    ) : null}
                    {minuteLabel ? (
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {minuteLabel}
                      </span>
                    ) : null}
                  </span>
                  {goal.period ? (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {goal.period}
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
      key={state.success ?? "idle"}
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
        <SearchableSelect
          id={`add-goal-player-${periodId ?? "match"}`}
          name="player_id"
          required
          disabled={pending}
          placeholder="Search scorers by name…"
          emptyMessage="No scorers match that name."
          options={[
            ...playerOptions.map((player) => ({
              value: player.id,
              label: `${playerDisplayName(player, {
                shirtNumber: player.shirt_number,
              })}${!player.active ? " (inactive)" : ""}`,
            })),
            {
              value: OWN_GOAL_SCORER_VALUE,
              label: `${teamName}: ${OWN_GOAL_LABEL}`,
            },
            {
              value: OPPOSITION_SCORER_VALUE,
              label: `${opponentName || "Opposition"}: ${OPPOSITION_GOAL_LABEL}`,
            },
          ]}
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
