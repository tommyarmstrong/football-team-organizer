import type { PeriodEvent, PlayerCountPoint } from "@/lib/data/stats";
import { matchesCompetitionFilters } from "@/lib/stats/competition-filters";
import {
  filterRowsByPositions,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";

export type PeriodTypeFilter = "all" | "quarters" | "halves" | "extra_time";

export const DEFAULT_PERIOD_TYPE_FILTER: PeriodTypeFilter = "all";

export const PERIOD_TYPE_FILTER_OPTIONS: ReadonlyArray<{
  value: PeriodTypeFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "quarters", label: "Quarters" },
  { value: "halves", label: "Halves" },
  { value: "extra_time", label: "Extra time" },
];

/** Label for the percent column / series that "Periods per game" shows. */
export const PERIODS_PER_GAME_PERCENT_LABEL = "Periods per game (%)";

/**
 * The share of the periods in a player's games that they started, as a percent
 * (0-100). `null` when they have no periods to measure against.
 */
export function periodsPerGamePercent(
  periodsStarted: number,
  periodsAvailable: number,
): number | null {
  if (periodsAvailable <= 0) return null;
  return (periodsStarted / periodsAvailable) * 100;
}

export function formatPeriodsPerGamePercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function filterPeriodEvents(
  events: PeriodEvent[],
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
  periodType: PeriodTypeFilter,
): PeriodEvent[] {
  return events.filter(
    (event) =>
      (periodType === "all" || event.periodType === periodType) &&
      matchesCompetitionFilters({
        competitionId: event.competitionId,
        competitionKind: event.competitionKind,
        isFriendly: event.isFriendly,
        selectedCompetitionId,
        selectedCompetitionKind,
      }),
  );
}

/**
 * Applies the page competition filters and the period Type filter to period
 * starts. `count` becomes the periods started that match, and
 * `periodsAvailable` the periods in the player's games that match (the same
 * filters, so the percent compares like with like). Players with no matching
 * start are left out, most starts first.
 */
export function filterPeriodStarts(
  data: PlayerCountPoint[],
  competitionId: string,
  competitionKind: string,
  periodType: PeriodTypeFilter,
): PlayerCountPoint[] {
  const filtered: PlayerCountPoint[] = [];
  for (const row of data) {
    const starts = filterPeriodEvents(
      (row.events ?? []) as PeriodEvent[],
      competitionId,
      competitionKind,
      periodType,
    );
    if (starts.length === 0) continue;
    const available = filterPeriodEvents(
      row.periodsInGames ?? [],
      competitionId,
      competitionKind,
      periodType,
    );
    filtered.push({
      ...row,
      count: starts.length,
      events: starts,
      periodsInGames: available,
      periodsAvailable: available.length,
    });
  }

  return filtered.sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export type PeriodStartsRow = PlayerCountPoint & {
  periodsAvailable: number;
  /** What the chart plots: periods started, or the percent for "per_game". */
  value: number;
};

/**
 * Chart rows for the Period starts section, always ordered by periods started.
 * In the "per_game" view the value is the percent of the periods in the
 * player's games that they started, and players with no periods to measure
 * against are left out.
 */
export function buildPeriodStartsViewRows(
  data: PlayerCountPoint[],
  selected: readonly GoalsPositionFilter[],
  metric: GoalsMetric,
): PeriodStartsRow[] {
  return filterRowsByPositions(data, selected)
    .flatMap((row) => {
      const periodsAvailable = row.periodsAvailable ?? 0;
      const value =
        metric === "per_game"
          ? periodsPerGamePercent(row.count, periodsAvailable)
          : row.count;
      if (value == null) return [];
      return [{ ...row, periodsAvailable, value }];
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
