export type LeaderRowInput = {
  playerId: string;
  name: string;
  /** What the bar plots: a total, or a per-game / per-period rate. */
  value: number;
};

export type LeaderRow = LeaderRowInput & {
  /** The value as text: whole numbers for totals, two decimals for rates. */
  display: string;
};

export function formatLeaderValue(value: number, decimals: boolean): string {
  return decimals ? value.toFixed(2) : String(value);
}

/**
 * Rows for the report-style leader bars: highest value first (ties by name),
 * and players on zero are left out, like the report's "Top scorers".
 */
export function buildLeaderRows(
  rows: readonly LeaderRowInput[],
  decimals = false,
): LeaderRow[] {
  return rows
    .filter((row) => row.value > 0)
    .map((row) => ({
      playerId: row.playerId,
      name: row.name,
      value: row.value,
      display: formatLeaderValue(row.value, decimals),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}
