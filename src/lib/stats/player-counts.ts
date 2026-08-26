import type { PlayerCountPoint } from "@/lib/data/stats";
import {
  filterStatCompetitions,
  hasCompetitionFilter,
} from "@/lib/stats/competition-filters";

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
