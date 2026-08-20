"use client";

import Link from "next/link";
import { availableExtraTimeOrPenaltyPeriodNames } from "@/lib/constants";
import { deletePeriodAction } from "@/lib/match-periods/actions";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import { GoalScorerChip } from "@/components/matches/match-goals-section";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

export function MatchPeriodsSection({
  matchId,
  periods,
  goals,
  canEdit = true,
}: {
  matchId: string;
  periods: MatchPeriodWithStarters[];
  goals: GoalWithPlayers[];
  canEdit?: boolean;
}) {
  const canAddExtraTime =
    canEdit &&
    availableExtraTimeOrPenaltyPeriodNames(periods.map((period) => period.name))
      .length > 0;

  if (!canEdit && periods.length === 0) {
    return (
      <EmptyState
        title="No periods"
        description="Halves, quarters, or other periods will appear here once added."
      />
    );
  }

  return (
    <div className="space-y-4">
      {periods.length === 0 ? (
        <EmptyState
          title="No periods yet"
          description="Regulation periods are added when the fixture is created. Add extra time or penalties if the match needs them."
        />
      ) : (
        <ul className={objectListClassName}>
          {periods.map((period) => {
            const periodGoals = goals.filter((g) => g.period_id === period.id);
            return (
              <li key={period.id} className="flex items-stretch">
                <Link
                  href={`/matches/${matchId}/periods/${period.id}`}
                  className={objectListRowClassName("flex-wrap gap-y-2")}
                >
                  <span className="min-w-0 shrink-0 font-medium">
                    {period.name}
                  </span>
                  {periodGoals.length > 0 ? (
                    <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                      {periodGoals.map((goal) => (
                        <GoalScorerChip key={goal.id} goal={goal} />
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex-1 text-xs">
                      No goals
                    </span>
                  )}
                </Link>
                {canEdit ? (
                  <div className="flex items-center pr-2">
                    <ListDeleteButton
                      label={`Delete period ${period.name}`}
                      confirmMessage="Remove this period? Goals linked to it will keep their text label but lose the period link."
                      deleteAction={() =>
                        deletePeriodAction(matchId, period.id)
                      }
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canAddExtraTime ? (
        <Link
          href={`/matches/${matchId}/periods/new`}
          className={buttonVariants()}
        >
          Add
        </Link>
      ) : null}
    </div>
  );
}
