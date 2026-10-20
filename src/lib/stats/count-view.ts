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

/** Chart rows for assists and appearances, using the goal-scorer view rules. */
export function buildCountViewRows(
  data: PlayerCountPoint[],
  selected: readonly GoalsPositionFilter[],
  metric: GoalsMetric,
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
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}
