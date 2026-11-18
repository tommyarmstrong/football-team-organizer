/** How many players a leaderboard shows before "Show all". */
export const LEADERBOARD_PREVIEW_LIMIT = 5;

export function visibleLeaderRows<T>(
  rows: readonly T[],
  expanded: boolean,
): T[] {
  if (expanded) return [...rows];
  return rows.slice(0, LEADERBOARD_PREVIEW_LIMIT);
}

export function leaderboardCanExpand(count: number): boolean {
  return count > LEADERBOARD_PREVIEW_LIMIT;
}
