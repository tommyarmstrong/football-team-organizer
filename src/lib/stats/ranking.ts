/**
 * Keeps every row whose competition rank is at most `maxRank`, so players tied
 * on the same value are never split by a row cut-off.
 */
export function takeThroughRank<T>(
  rowsDescending: readonly T[],
  metric: (row: T) => number,
  maxRank: number,
): T[] {
  const ranks = competitionRanks(rowsDescending.map(metric));
  return rowsDescending.filter((_, index) => ranks[index]! <= maxRank);
}

/**
 * Standard competition ranking ("1224") for metrics already sorted descending.
 * Equal values share the best rank. The next distinct value is
 * 1 + the number of rows strictly ahead.
 */
export function competitionRanks(
  metricsDescending: readonly number[],
): number[] {
  const ranks: number[] = [];
  for (let index = 0; index < metricsDescending.length; index++) {
    const previous = ranks[index - 1];
    if (
      index > 0 &&
      metricsDescending[index] === metricsDescending[index - 1] &&
      previous != null
    ) {
      ranks.push(previous);
    } else {
      ranks.push(index + 1);
    }
  }
  return ranks;
}
