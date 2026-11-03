import type { PlayerCountPoint } from "@/lib/data/stats";
import {
  countMetricValue,
  filterRowsByPositions,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";

export function countMetricLabel(metric: GoalsMetric, noun: string): string {
  switch (metric) {
    case "total":
      return noun;
    case "per_game":
      return `${noun} / game`;
    case "per_period":
      return `${noun} / period`;
  }
}

/** Period starts have no per-period rate, so only these two views. */
export const PERIOD_STARTS_METRIC_OPTIONS: ReadonlyArray<{
  value: GoalsMetric;
  label: string;
}> = [
  { value: "total", label: "Periods" },
  { value: "per_game", label: "Periods per game" },
];

/**
 * Chart rows for assists, appearances and period starts, using the
 * goal-scorer view rules. Rows are ordered by the plotted value unless
 * `orderBy` is "count", which keeps them ordered by the total whatever the view.
 */
export function buildCountViewRows(
  data: PlayerCountPoint[],
  selected: readonly GoalsPositionFilter[],
  metric: GoalsMetric,
  orderBy: "value" | "count" = "value",
): Array<PlayerCountPoint & { value: number }> {
  return filterRowsByPositions(data, selected)
    .flatMap((row) => {
      const matchesPlayed = row.matchesPlayed ?? row.count;
      const periodsPlayed = row.periodsPlayed ?? 0;
      const value = countMetricValue(
        { count: row.count, matchesPlayed, periodsPlayed },
        metric,
      );
      if (value == null) return [];
      return [{ ...row, matchesPlayed, periodsPlayed, value }];
    })
    .sort(
      (a, b) =>
        (orderBy === "count" ? b.count - a.count : b.value - a.value) ||
        a.name.localeCompare(b.name),
    );
}
