import type { PlayerCountPoint } from "@/lib/data/stats";
import {
  filterStatCompetitions,
  hasCompetitionFilter,
} from "@/lib/stats/competition-filters";

/** Per-game rates use played match-day squad appearances for the active filter. */
export function withPlayedAppearanceCounts<
  T extends { playerId: string; matchesPlayed?: number },
>(rows: T[], appearances: PlayerCountPoint[]): T[] {
  const counts = new Map(
    appearances.map((row) => [row.playerId, row.count] as const),
  );
  return rows.map((row) => ({
    ...row,
    matchesPlayed: counts.get(row.playerId) ?? 0,
  }));
}

export function filterPlayerCountPoints(
  data: PlayerCountPoint[],
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
): PlayerCountPoint[] {
  if (!hasCompetitionFilter(selectedCompetitionId, selectedCompetitionKind)) {
    return data;
  }

  const filtered: PlayerCountPoint[] = [];
  for (const row of data) {
    const matching = filterStatCompetitions(
      row.events ?? [],
      selectedCompetitionId,
      selectedCompetitionKind,
    );
    if (matching.length === 0) continue;
    filtered.push({
      ...row,
      count: matching.length,
      events: matching,
    });
  }

  return filtered.sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}
