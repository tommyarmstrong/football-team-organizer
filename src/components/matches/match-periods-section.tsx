"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { MATCH_PERIOD_NAMES } from "@/lib/constants";
import {
  createPeriodAction,
  deletePeriodAction,
} from "@/lib/match-periods/actions";
import type { GoalWithPlayers } from "@/lib/data/goals";
import type { MatchPeriodWithStarters } from "@/lib/data/match-periods";
import { GoalScorerChip } from "@/components/matches/match-goals-section";
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
          description="Add a period below, then set starting players and goals on the period page."
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
                        <GoalScorerChip
                          key={goal.id}
                          goal={goal}
                          className="gap-1 px-2 py-0.5 text-xs"
                        />
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

      {canEdit ? <AddPeriodForm matchId={matchId} /> : null}
    </div>
  );
}

function AddPeriodForm({ matchId }: { matchId: string }) {
  const bound = createPeriodAction.bind(null, matchId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  return (
    <form
      key={state.success ?? "idle"}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="add-period-name">Add period</Label>
        <SearchableSelect
          id="add-period-name"
          name="name"
          required
          disabled={pending}
          placeholder="Search period names…"
          emptyMessage="No period names match."
          options={MATCH_PERIOD_NAMES.map((name) => ({
            value: name,
            label: name,
          }))}
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
