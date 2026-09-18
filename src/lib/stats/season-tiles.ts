import type { ResultOverTimePoint } from "@/lib/data/stats";
import {
  tallyGoals,
  tallyResults,
  type GoalsTally,
  type ResultTally,
} from "@/lib/stats/results-view";

export type SeasonTile = {
  label: string;
  value: string;
  ariaLabel?: string;
};

export function playedCount(tally: ResultTally): number {
  return tally.wins + tally.draws + tally.losses;
}

export function formatWdl(tally: ResultTally): string {
  return `${tally.wins}–${tally.draws}–${tally.losses}`;
}

export function formatWdlAriaLabel(tally: ResultTally): string {
  return `${tally.wins} wins, ${tally.draws} draws, ${tally.losses} losses`;
}

export function formatGoalsForAgainst(tally: GoalsTally): string {
  return `${tally.goalsFor}–${tally.goalsAgainst}`;
}

/** Always include a sign. Uses a minus sign (U+2212) for negatives. */
export function formatGoalDifference(
  goalsFor: number,
  goalsAgainst: number,
): string {
  const difference = goalsFor - goalsAgainst;
  if (difference > 0) return `+${difference}`;
  if (difference < 0) return `−${Math.abs(difference)}`;
  return "+0";
}

export function seasonTilesFromResults(
  results: ResultOverTimePoint[],
): SeasonTile[] | null {
  const resultTally = tallyResults(results);
  const goalsTally = tallyGoals(results);
  const played = playedCount(resultTally);
  if (played === 0) return null;

  return [
    { label: "Played", value: String(played) },
    {
      label: "W–D–L",
      value: formatWdl(resultTally),
      ariaLabel: formatWdlAriaLabel(resultTally),
    },
    { label: "Goals", value: formatGoalsForAgainst(goalsTally) },
    {
      label: "Goal difference",
      value: formatGoalDifference(goalsTally.goalsFor, goalsTally.goalsAgainst),
    },
  ];
}
