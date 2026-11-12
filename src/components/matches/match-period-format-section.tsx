"use client";

import { useEffect, useState } from "react";
import { useToastActionState } from "@/hooks/use-toast-action-state";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { changePeriodFormatAction } from "@/lib/match-periods/actions";
import {
  PERIOD_FORMAT_LABELS,
  currentPeriodFormat,
  extraTimeStandInCount,
  oppositePeriodFormat,
  planFormatChange,
  planPreviewRows,
  type FormatChangePeriod,
  type PeriodCounts,
  type PeriodFormat,
} from "@/lib/match-periods/format-change";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";

/** A period as the format dialog needs it: the planner fields plus counts. */
export type PeriodFormatPeriod = FormatChangePeriod & {
  goalCount: number;
  starterCount: number;
};

/** The format the "Change period format" button would switch to, or null. */
export function periodFormatChangeTarget(
  periods: readonly Pick<FormatChangePeriod, "name">[],
): PeriodFormat | null {
  return oppositePeriodFormat(currentPeriodFormat(periods));
}

export function periodFormatChangeLabel(target: PeriodFormat): string {
  return `Change to ${PERIOD_FORMAT_LABELS[target]}`;
}

/** "a quarter", "quarters", "a half" or "halves" for the Extra time checkbox. */
export function extraTimeUnit(target: PeriodFormat, count: number): string {
  if (target === "quarters") return count === 1 ? "a quarter" : "quarters";
  return count === 1 ? "a half" : "halves";
}

export function MatchPeriodFormatSection({
  matchId,
  periods,
  onSuccess,
  onCancel,
}: {
  matchId: string;
  periods: PeriodFormatPeriod[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const bound = changePeriodFormatAction.bind(null, matchId);
  const [state, formAction, pending] = useToastActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [useExtraTime, setUseExtraTime] = useState(true);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  const target = periodFormatChangeTarget(periods);
  const extraTimeCount = target ? extraTimeStandInCount(periods, target) : 0;

  const counts: PeriodCounts = Object.fromEntries(
    periods.map((period) => [
      period.id,
      { goals: period.goalCount, starters: period.starterCount },
    ]),
  );

  const result = target
    ? planFormatChange(periods, target, { useExtraTime })
    : null;

  if (!target || !result) {
    return (
      <EmptyState
        title="Nothing to change"
        description="This match's periods are not quarters or halves, so the format cannot be switched."
      />
    );
  }

  if (!result.ok) {
    return <ErrorBanner message={result.error} />;
  }

  const unit = extraTimeUnit(target, extraTimeCount);
  const rows = planPreviewRows(result.plan, counts);
  const lastKept = result.plan.keep[result.plan.keep.length - 1];
  const mergesGoals = result.plan.merge.some(
    (item) => (counts[item.periodId]?.goals ?? 0) > 0,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="target" value={target} />

      <div className="bg-card ring-foreground/8 overflow-hidden rounded-2xl shadow-sm ring-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-muted-foreground border-foreground/8 border-b text-left text-xs">
              <th scope="col" className="px-3 py-2 font-medium">
                Now
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Becomes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.kind}:${row.from ?? "new"}:${row.to}`}
                className="border-foreground/8 border-b align-top last:border-b-0"
              >
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {row.from ?? (
                    <span className="text-muted-foreground font-normal">
                      New
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium">
                    {row.kind === "merge" ? "Removed" : row.to}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {row.note}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {extraTimeCount > 0 ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="use_extra_time"
            className="mt-0.5"
            checked={useExtraTime}
            disabled={pending}
            onChange={(event) => setUseExtraTime(event.target.checked)}
          />
          <span>
            Use Extra time as {unit}
            <span className="text-muted-foreground block text-xs">
              Tick this if the extra periods were really {unit}. Untick it if
              there was real extra time.
            </span>
          </span>
        </label>
      ) : null}

      {mergesGoals && lastKept ? (
        <p className="text-muted-foreground text-xs">
          Goals in removed periods are kept and moved into {lastKept.toName}.
        </p>
      ) : null}

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Changing…" : periodFormatChangeLabel(target)}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
