import { PLAYER_POSITIONS } from "@/lib/constants";
import type { GoalsByPlayerPoint } from "@/lib/data/stats";
import {
  ALL_COMPETITIONS,
  ALL_COMPETITION_KINDS,
  matchesCompetitionFilters,
} from "@/lib/stats/competition-filters";

export const GOALS_POSITION_FILTERS = [
  "ALL",
  "FWD",
  "MID",
  "DEF",
  "GK",
] as const;

export type GoalsPositionFilter = (typeof GOALS_POSITION_FILTERS)[number];

export type GoalsMetric = "total" | "per_game" | "per_period";

export const GOALS_METRIC_OPTIONS: ReadonlyArray<{
  value: GoalsMetric;
  label: string;
}> = [
  { value: "total", label: "Total" },
  { value: "per_game", label: "Per game" },
  { value: "per_period", label: "Per period" },
];

const POSITION_SET = new Set<string>(PLAYER_POSITIONS);

export function toggleGoalsPositionFilter(
  current: GoalsPositionFilter[],
  next: GoalsPositionFilter,
): GoalsPositionFilter[] {
  if (next === "ALL") return ["ALL"];

  const withoutAll = current.filter((value) => value !== "ALL");
  const selected = new Set(withoutAll);

  if (selected.has(next)) {
    selected.delete(next);
  } else {
    selected.add(next);
  }

  if (selected.size === 0) return ["ALL"];

  return GOALS_POSITION_FILTERS.filter(
    (value): value is Exclude<GoalsPositionFilter, "ALL"> =>
      value !== "ALL" && selected.has(value),
  );
}

export function filterGoalsByCompetition(
  data: GoalsByPlayerPoint[],
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
): GoalsByPlayerPoint[] {
  const noCompetitionFilter =
    selectedCompetitionId === ALL_COMPETITIONS &&
    selectedCompetitionKind === ALL_COMPETITION_KINDS;
  if (noCompetitionFilter) return data;

  return data
    .map((row) => {
      const matching = (row.goalCompetitions ?? []).filter((goal) =>
        matchesCompetitionFilters({
          competitionId: goal.competitionId,
          competitionKind: goal.competitionKind,
          selectedCompetitionId,
          selectedCompetitionKind,
        }),
      );
      if (matching.length === 0) return null;
      return {
        ...row,
        goals: matching.length,
        goalCompetitions: matching,
      };
    })
    .filter((row): row is GoalsByPlayerPoint => row != null);
}

export function filterGoalsByPositions(
  data: GoalsByPlayerPoint[],
  selected: readonly GoalsPositionFilter[],
): GoalsByPlayerPoint[] {
  if (selected.includes("ALL") || selected.length === 0) return data;

  const positions = new Set<string>(
    selected.filter((value) => POSITION_SET.has(value)),
  );

  return data.filter(
    (row) => row.position != null && positions.has(row.position),
  );
}

export function goalsMetricValue(
  row: GoalsByPlayerPoint,
  metric: GoalsMetric,
): number | null {
  if (metric === "total") return row.goals;
  if (metric === "per_game") {
    return row.matchesPlayed > 0 ? row.goals / row.matchesPlayed : null;
  }
  return row.periodsPlayed > 0 ? row.goals / row.periodsPlayed : null;
}

export function formatGoalsMetricValue(
  value: number | null,
  metric: GoalsMetric,
): string {
  if (value == null) return "—";
  if (metric === "total") return String(value);
  return value.toFixed(2);
}

export function goalsMetricLabel(metric: GoalsMetric): string {
  switch (metric) {
    case "total":
      return "Goals";
    case "per_game":
      return "Goals / game";
    case "per_period":
      return "Goals / period";
  }
}

export function buildGoalsViewRows(
  data: GoalsByPlayerPoint[],
  selectedPositions: readonly GoalsPositionFilter[],
  metric: GoalsMetric,
  selectedCompetitionId: string = ALL_COMPETITIONS,
  selectedCompetitionKind: string = ALL_COMPETITION_KINDS,
): Array<{
  playerId: string;
  name: string;
  value: number;
  displayValue: string;
  goalsDisplay: string;
  goalsPerGameDisplay: string;
}> {
  return filterGoalsByPositions(
    filterGoalsByCompetition(
      data,
      selectedCompetitionId,
      selectedCompetitionKind,
    ),
    selectedPositions,
  )
    .map((row) => {
      const value = goalsMetricValue(row, metric);
      if (value == null) return null;
      return {
        playerId: row.playerId,
        name: row.name,
        value,
        displayValue: formatGoalsMetricValue(value, metric),
        goalsDisplay: formatGoalsMetricValue(row.goals, "total"),
        goalsPerGameDisplay: formatGoalsMetricValue(
          goalsMetricValue(row, "per_game"),
          "per_game",
        ),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}
