import type { GoalsByPlayerPoint, PlayerCountPoint } from "@/lib/data/stats";
import { countMetricLabel } from "@/lib/stats/count-view";
import {
  countMetricValue,
  filterRowsByPositions,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";

/** View choices on the attacking chart: total and per game. */
export const ATTACKING_METRIC_OPTIONS: ReadonlyArray<{
  value: Exclude<GoalsMetric, "per_period">;
  label: string;
}> = [
  { value: "total", label: "Total" },
  { value: "per_game", label: "Per game" },
];

export type AttackingMode = "goals" | "assists" | "involvements";

export const ATTACKING_MODE_OPTIONS: ReadonlyArray<{
  value: AttackingMode;
  label: string;
}> = [
  { value: "goals", label: "Goals" },
  { value: "assists", label: "Assists" },
  { value: "involvements", label: "G+A" },
];

export type AttackingViewRow = {
  playerId: string;
  name: string;
  /** Goals, assists, or the sum, before the rate is applied. */
  count: number;
  value: number;
};

type AttackPlayer = {
  playerId: string;
  name: string;
  position: string | null;
  goals: number;
  assists: number;
  matchesPlayed: number;
  periodsPlayed: number;
};

function blankPlayer(
  playerId: string,
  name: string,
  position: string | null,
): AttackPlayer {
  return {
    playerId,
    name,
    position,
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    periodsPlayed: 0,
  };
}

/**
 * One row per player who scored or assisted. Appearances and periods played
 * are the denominators for the rates. Callers pass appearance-adjusted rows.
 */
function mergeAttackers(
  goals: readonly GoalsByPlayerPoint[],
  assists: readonly PlayerCountPoint[],
): AttackPlayer[] {
  const byId = new Map<string, AttackPlayer>();

  for (const row of goals) {
    const player =
      byId.get(row.playerId) ??
      blankPlayer(row.playerId, row.name, row.position);
    player.goals = row.goals;
    player.name = row.name || player.name;
    player.position = row.position ?? player.position;
    player.matchesPlayed = Math.max(player.matchesPlayed, row.matchesPlayed);
    player.periodsPlayed = Math.max(player.periodsPlayed, row.periodsPlayed);
    byId.set(row.playerId, player);
  }

  for (const row of assists) {
    const player =
      byId.get(row.playerId) ??
      blankPlayer(row.playerId, row.name, row.position ?? null);
    player.assists = row.count;
    if (!player.name) player.name = row.name;
    player.position = player.position ?? row.position ?? null;
    player.matchesPlayed = Math.max(
      player.matchesPlayed,
      row.matchesPlayed ?? 0,
    );
    player.periodsPlayed = Math.max(
      player.periodsPlayed,
      row.periodsPlayed ?? 0,
    );
    byId.set(row.playerId, player);
  }

  return [...byId.values()];
}

function numerator(player: AttackPlayer, mode: AttackingMode): number {
  if (mode === "goals") return player.goals;
  if (mode === "assists") return player.assists;
  return player.goals + player.assists;
}

/**
 * Attacking leaderboard for Goals, Assists, or G+A. Sorted highest first.
 * Per game divides by appearances. Per period divides by periods played.
 * Players with nothing to count, or no games/periods for a rate, are left out.
 */
export function buildAttackingViewRows(
  goals: readonly GoalsByPlayerPoint[],
  assists: readonly PlayerCountPoint[],
  positions: readonly GoalsPositionFilter[],
  mode: AttackingMode,
  metric: GoalsMetric,
): AttackingViewRow[] {
  return filterRowsByPositions(mergeAttackers(goals, assists), positions)
    .flatMap((player) => {
      const count = numerator(player, mode);
      if (count <= 0) return [];
      const value = countMetricValue(
        {
          count,
          matchesPlayed: player.matchesPlayed,
          periodsPlayed: player.periodsPlayed,
        },
        metric,
      );
      if (value == null) return [];
      return [
        {
          playerId: player.playerId,
          name: player.name,
          count,
          value,
        },
      ];
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function attackingUnit(
  mode: AttackingMode,
  metric: GoalsMetric,
): string {
  const noun =
    mode === "goals" ? "Goals" : mode === "assists" ? "Assists" : "G+A";
  return countMetricLabel(metric, noun).toLowerCase();
}
