import type { ResultOverTimePoint } from "@/lib/data/stats";
import {
  hasCompetitionFilter,
  matchesCompetitionFilters,
} from "@/lib/stats/competition-filters";

export function filterResults(
  data: ResultOverTimePoint[],
  selectedCompetitionId: string,
  selectedCompetitionKind: string,
): ResultOverTimePoint[] {
  if (!hasCompetitionFilter(selectedCompetitionId, selectedCompetitionKind)) {
    return data;
  }

  return data.filter((point) =>
    matchesCompetitionFilters({
      competitionId: point.competitionId,
      competitionKind: point.competitionKind,
      isFriendly: point.isFriendly,
      selectedCompetitionId,
      selectedCompetitionKind,
    }),
  );
}

export function withGoalDifference(
  data: ResultOverTimePoint[],
): Array<ResultOverTimePoint & { goalDifference: number }> {
  return data.map((point) => ({
    ...point,
    goalDifference: point.goalsFor - point.goalsAgainst,
  }));
}

export type ResultTally = {
  wins: number;
  draws: number;
  losses: number;
};

export function tallyResults(data: ResultOverTimePoint[]): ResultTally {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const point of data) {
    if (point.result === "W") wins += 1;
    else if (point.result === "D") draws += 1;
    else losses += 1;
  }
  return { wins, draws, losses };
}

export type GoalsTally = {
  goalsFor: number;
  goalsAgainst: number;
};

export function tallyGoals(data: ResultOverTimePoint[]): GoalsTally {
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const point of data) {
    goalsFor += point.goalsFor;
    goalsAgainst += point.goalsAgainst;
  }
  return { goalsFor, goalsAgainst };
}

export type CumulativeResultPoint = {
  matchId: string;
  date: string;
  label: string;
  wins: number;
  draws: number;
  losses: number;
};

export function cumulativeResults(
  data: ResultOverTimePoint[],
): CumulativeResultPoint[] {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  return data.map((point) => {
    if (point.result === "W") wins += 1;
    else if (point.result === "D") draws += 1;
    else losses += 1;
    return {
      matchId: point.matchId,
      date: point.date,
      label: point.label,
      wins,
      draws,
      losses,
    };
  });
}
