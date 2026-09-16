"use client";

import Link from "next/link";
import { matchPeriodSortOrder } from "@/lib/constants";
import { deleteGoalAction } from "@/lib/goals/actions";
import { goalAssistsAllowed } from "@/lib/form-parse";
import {
  formatHomeFirstScore,
  goalScorerLabel,
  playerDisplayName,
  scoreFromGoals,
} from "@/lib/format";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchHomeAway } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

export function playerEventNameClassName(className?: string): string {
  return cn(
    "inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 text-sm font-medium",
    className,
  );
}

export function goalAssistPlayer(
  goal: GoalWithPlayers,
): { first_name: string; last_name: string } | null {
  if (!goal.assist || !goalAssistsAllowed(goal, goal)) return null;
  return goal.assist;
}

export function GoalScorerName({
  goal,
  className,
}: {
  goal: GoalWithPlayers;
  className?: string;
}) {
  return (
    <span
      className={playerEventNameClassName(
        cn(goal.is_opposition && "text-red-600 dark:text-red-400", className),
      )}
    >
      <span aria-hidden="true">⚽</span>
      <span className="truncate">{goalScorerLabel(goal)}</span>
    </span>
  );
}

export function GoalAssistName({
  player,
  className,
}: {
  player: { first_name: string; last_name: string };
  className?: string;
}) {
  return (
    <span className={playerEventNameClassName(className)}>
      <span aria-hidden="true">🤝</span>
      <span className="truncate">{playerDisplayName(player)}</span>
    </span>
  );
}

export function PlayerOfTheMatchName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={playerEventNameClassName(className)}>
      <span aria-hidden="true">🏆</span>
      <span className="truncate">{name}</span>
    </span>
  );
}

export type GoalPeriodGroup = {
  key: string;
  label: string;
  periodId: string | null;
  goals: GoalWithPlayers[];
};

export type GoalPeriodRef = {
  id: string;
  name: string;
};

function compareGoalPeriodGroups(a: GoalPeriodGroup, b: GoalPeriodGroup) {
  return matchPeriodSortOrder(a.label) - matchPeriodSortOrder(b.label);
}

function appendGoalToGroups(
  groups: GoalPeriodGroup[],
  indexByKey: Map<string, number>,
  goal: GoalWithPlayers,
) {
  const label = goal.period?.trim() || "—";
  const key = goal.period_id ?? `label:${label}`;
  let index = indexByKey.get(key);
  if (index == null) {
    index = groups.length;
    indexByKey.set(key, index);
    groups.push({
      key,
      label,
      periodId: goal.period_id,
      goals: [],
    });
  }
  groups[index].goals.push(goal);
}

export function groupGoalsByPeriod(
  goals: GoalWithPlayers[],
  periods?: GoalPeriodRef[],
): GoalPeriodGroup[] {
  if (periods && periods.length > 0) {
    const groups: GoalPeriodGroup[] = periods.map((period) => ({
      key: period.id,
      label: period.name,
      periodId: period.id,
      goals: [],
    }));
    const indexById = new Map(
      periods.map((period, index) => [period.id, index]),
    );
    const orphans: GoalPeriodGroup[] = [];
    const orphanIndexByKey = new Map<string, number>();

    for (const goal of goals) {
      const periodIndex =
        goal.period_id != null ? indexById.get(goal.period_id) : undefined;
      if (periodIndex != null) {
        groups[periodIndex].goals.push(goal);
        continue;
      }
      appendGoalToGroups(orphans, orphanIndexByKey, goal);
    }

    orphans.sort(compareGoalPeriodGroups);
    return [...groups, ...orphans];
  }

  const groups: GoalPeriodGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const goal of goals) {
    appendGoalToGroups(groups, indexByKey, goal);
  }
  return [...groups].sort(compareGoalPeriodGroups);
}

/** Running home-first score after each period group in display order. */
export function periodEndScores(
  groups: GoalPeriodGroup[],
  homeAway: MatchHomeAway,
): string[] {
  let goalsFor = 0;
  let goalsAgainst = 0;
  return groups.map((group) => {
    const periodScore = scoreFromGoals(group.goals);
    goalsFor += periodScore.goalsFor;
    goalsAgainst += periodScore.goalsAgainst;
    return formatHomeFirstScore(goalsFor, goalsAgainst, homeAway);
  });
}

export function MatchGoalsSection({
  matchId,
  goals,
  canEdit = true,
  periodId = null,
  periods,
  showAddPeriod = false,
  homeAway,
}: {
  matchId: string;
  goals: GoalWithPlayers[];
  canEdit?: boolean;
  /** When set, new goals are linked to this period. */
  periodId?: string | null;
  /** When set, every period is listed in this order, including those with no goals. */
  periods?: GoalPeriodRef[];
  showAddPeriod?: boolean;
  /** When set, show the cumulative home-first score under each period name. */
  homeAway?: MatchHomeAway;
}) {
  const groups = groupGoalsByPeriod(goals, periods);
  const endScores = homeAway ? periodEndScores(groups, homeAway) : null;
  const hasRows = groups.length > 0;

  if (!canEdit && !hasRows) {
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
      {!hasRows ? (
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
          {groups.map((group, index) => (
            <li key={group.key} className="flex items-stretch">
              <div className={objectListRowClassName("items-stretch")}>
                {group.periodId ? (
                  <Link
                    href={`/matches/${matchId}/periods/${group.periodId}`}
                    className="min-w-0 shrink-0 self-start pt-0.5 font-medium underline-offset-4 hover:underline"
                  >
                    <span className="block">{group.label}</span>
                    {endScores ? (
                      <span className="text-muted-foreground mt-0.5 block text-xs font-normal no-underline">
                        {endScores[index]}
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="min-w-0 shrink-0 self-start pt-0.5 font-medium">
                    <span className="block">{group.label}</span>
                    {endScores ? (
                      <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                        {endScores[index]}
                      </span>
                    ) : null}
                  </span>
                )}
                <div className="divide-border min-w-0 flex-1 divide-y">
                  {group.goals.length === 0 ? (
                    <span className="text-muted-foreground text-xs">
                      No goals
                    </span>
                  ) : (
                    group.goals.map((goal) => {
                      const assist = goalAssistPlayer(goal);
                      return (
                        <div
                          key={goal.id}
                          className="flex items-start gap-2 py-2 first:pt-0 last:pb-0"
                        >
                          <Link
                            href={`/matches/${matchId}/goals/${goal.id}`}
                            className={objectListRowClassName(
                              "min-h-0 flex-1 items-start px-0 py-0 hover:bg-transparent focus-visible:ring-offset-2",
                            )}
                          >
                            <span
                              className={
                                assist
                                  ? "flex min-w-0 flex-1 flex-col items-start gap-1.5"
                                  : "flex min-w-0 flex-1 flex-col items-start"
                              }
                            >
                              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                                <GoalScorerName goal={goal} />
                                {goal.is_penalty ? (
                                  <span className="text-muted-foreground text-xs font-medium">
                                    (P)
                                  </span>
                                ) : null}
                              </span>
                              {assist ? (
                                <GoalAssistName player={assist} />
                              ) : null}
                            </span>
                          </Link>
                          {canEdit ? (
                            <div className="flex items-start">
                              <ListDeleteButton
                                label={`Delete goal by ${goalScorerLabel(goal)}`}
                                confirmMessage="Remove this goal?"
                                deleteAction={() =>
                                  deleteGoalAction(matchId, goal.id)
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={addHref} className={buttonVariants()}>
            Add goal
          </Link>
          {showAddPeriod ? (
            <Link
              href={`/matches/${matchId}/periods/new`}
              className={buttonVariants()}
            >
              Add period
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
