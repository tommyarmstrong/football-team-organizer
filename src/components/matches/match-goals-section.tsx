"use client";

import Link from "next/link";
import { deleteGoalAction } from "@/lib/goals/actions";
import {
  formatGoalMinute,
  goalKindLabel,
  goalScorerLabel,
  playerDisplayName,
} from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

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
  canEdit = true,
  periodId = null,
}: {
  matchId: string;
  goals: GoalWithPlayers[];
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

  const addHref = periodId
    ? `/matches/${matchId}/goals/new?period_id=${periodId}`
    : `/matches/${matchId}/goals/new`;

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <EmptyState
          title="No goals recorded"
          description={
            periodId
              ? "Add a goal for this period."
              : "Add a goal, then set the scorer and other details."
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
        <Link href={addHref} className={buttonVariants()}>
          Add
        </Link>
      ) : null}
    </div>
  );
}
