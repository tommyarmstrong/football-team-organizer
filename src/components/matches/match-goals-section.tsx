"use client";

import Link from "next/link";
import { deleteGoalAction } from "@/lib/goals/actions";
import { goalAssistsAllowed } from "@/lib/form-parse";
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
    "bg-background inline-flex max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-lg border px-2 py-0.5 text-xs font-medium",
    isOpposition
      ? "border-red-600 text-red-800 dark:text-red-200"
      : "border-green-600 text-green-800 dark:text-green-200",
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
    <span className={goalChipClassName(false, className)}>
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
            const meta = [minuteLabel, kind, goal.period].filter(Boolean);
            return (
              <li key={goal.id} className="flex items-stretch">
                <Link
                  href={`/matches/${matchId}/goals/${goal.id}`}
                  className={objectListRowClassName("items-start")}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <GoalScorerChip goal={goal} />
                      {goal.assist && goalAssistsAllowed(goal, goal) ? (
                        <GoalAssistChip player={goal.assist} />
                      ) : null}
                    </span>
                    {meta.length > 0 ? (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {meta.join(" · ")}
                      </span>
                    ) : null}
                  </span>
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
