"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type {
  GoalsByPlayerPoint,
  PlayerCountPoint,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";
import { filterPlayerCountPoints } from "@/lib/stats/player-counts";
import {
  filterResults,
  tallyGoals,
  tallyResults,
} from "@/lib/stats/results-view";
import { StatsCompetitionFilters } from "@/components/stats/stats-competition-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/shared/skeleton";

const GoalsSection = dynamic(
  () =>
    import("@/components/stats/goals-section").then((mod) => mod.GoalsSection),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const PlayerCountChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.PlayerCountChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const GoalDifferenceChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.GoalDifferenceChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const ResultsOverTimeChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.ResultsOverTimeChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const ResultsPieChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.ResultsPieChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const GoalsPieChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then((mod) => mod.GoalsPieChart),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

function ResultPieCharts({
  results,
  filteredResults,
  hasResultOutcomes,
  hasGoals,
  emptyFilterDescription,
}: {
  results: ResultOverTimePoint[];
  filteredResults: ResultOverTimePoint[];
  hasResultOutcomes: boolean;
  hasGoals: boolean;
  emptyFilterDescription: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Results
        </h2>
        {results.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Played matches with scores will appear here."
          />
        ) : !hasResultOutcomes ? (
          <EmptyState
            title="No results for this filter"
            description={emptyFilterDescription}
          />
        ) : (
          <ResultsPieChart data={filteredResults} />
        )}
      </div>

      <Section title="Goals">
        {results.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Played matches with scores will appear here."
          />
        ) : !hasGoals ? (
          <EmptyState
            title="No goals for this filter"
            description={emptyFilterDescription}
          />
        ) : (
          <GoalsPieChart data={filteredResults} />
        )}
      </Section>
    </div>
  );
}

export function StatsPageContent({
  goalsByPlayer,
  assistsByPlayer,
  potmByPlayer,
  matchesPlayed,
  results,
  competitions,
}: {
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  potmByPlayer: PlayerCountPoint[];
  matchesPlayed: PlayerCountPoint[];
  results: ResultOverTimePoint[];
  competitions: CompetitionFilterOption[];
}) {
  const [competitionId, setCompetitionId] = useState(ALL_COMPETITIONS);
  const [competitionKind, setCompetitionKind] = useState(ALL_COMPETITION_KINDS);

  const filteredResults = useMemo(
    () => filterResults(results, competitionId, competitionKind),
    [competitionId, competitionKind, results],
  );
  const filteredAssists = useMemo(
    () =>
      filterPlayerCountPoints(assistsByPlayer, competitionId, competitionKind),
    [assistsByPlayer, competitionId, competitionKind],
  );
  const filteredPotm = useMemo(
    () => filterPlayerCountPoints(potmByPlayer, competitionId, competitionKind),
    [competitionId, competitionKind, potmByPlayer],
  );
  const filteredAppearances = useMemo(
    () =>
      filterPlayerCountPoints(matchesPlayed, competitionId, competitionKind),
    [competitionId, competitionKind, matchesPlayed],
  );

  const resultTally = tallyResults(filteredResults);
  const goalsTally = tallyGoals(filteredResults);
  const hasResults = filteredResults.length > 0;
  const hasResultOutcomes =
    resultTally.wins + resultTally.draws + resultTally.losses > 0;
  const hasGoals = goalsTally.goalsFor + goalsTally.goalsAgainst > 0;
  const emptyFilterDescription = "Try another competition or competition type.";

  return (
    <>
      {results.length > 0 ||
      goalsByPlayer.length > 0 ||
      assistsByPlayer.length > 0 ||
      potmByPlayer.length > 0 ||
      matchesPlayed.length > 0 ? (
        <StatsCompetitionFilters
          idPrefix="stats"
          competitions={competitions}
          competitionId={competitionId}
          competitionKind={competitionKind}
          onCompetitionIdChange={setCompetitionId}
          onCompetitionKindChange={setCompetitionKind}
        />
      ) : null}

      <ResultPieCharts
        results={results}
        filteredResults={filteredResults}
        hasResultOutcomes={hasResultOutcomes}
        hasGoals={hasGoals}
        emptyFilterDescription={emptyFilterDescription}
      />

      <Section title="Goal difference">
        {results.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Played matches with scores will appear here."
          />
        ) : !hasResults ? (
          <EmptyState
            title="No results for this filter"
            description={emptyFilterDescription}
          />
        ) : (
          <GoalDifferenceChart data={filteredResults} />
        )}
      </Section>

      <Section title="Results">
        {results.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Played matches with scores will appear here."
          />
        ) : !hasResults ? (
          <EmptyState
            title="No results for this filter"
            description={emptyFilterDescription}
          />
        ) : (
          <ResultsOverTimeChart data={filteredResults} />
        )}
      </Section>

      <GoalsSection
        data={goalsByPlayer}
        competitionId={competitionId}
        competitionKind={competitionKind}
      />

      <PlayerCountSection
        title="Assists"
        emptyTitle="No assists yet"
        emptyDescription="Add assists on match detail pages to populate this chart."
        emptyFilterTitle="No assists for this filter"
        data={assistsByPlayer}
        filtered={filteredAssists}
        metricLabel="Assists"
        perGameLabel="Assists per game"
        ariaTitle="assists"
        emptyFilterDescription={emptyFilterDescription}
      />

      <PlayerCountSection
        title="Coach's player of the match"
        emptyTitle="No awards yet"
        emptyDescription="Select the coach's player of the match on fixtures to populate this chart."
        emptyFilterTitle="No awards for this filter"
        data={potmByPlayer}
        filtered={filteredPotm}
        metricLabel="Awards"
        ariaTitle="coach's player of the match"
        emptyFilterDescription={emptyFilterDescription}
      />

      <PlayerCountSection
        title="Appearances"
        emptyTitle="No squad appearances yet"
        emptyDescription="Add match-day squads to populate this chart."
        emptyFilterTitle="No appearances for this filter"
        data={matchesPlayed}
        filtered={filteredAppearances}
        metricLabel="Matches"
        ariaTitle="appearances"
        emptyFilterDescription={emptyFilterDescription}
      />
    </>
  );
}

function PlayerCountSection({
  title,
  emptyTitle,
  emptyDescription,
  emptyFilterTitle,
  emptyFilterDescription,
  data,
  filtered,
  metricLabel,
  perGameLabel,
  ariaTitle,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyFilterTitle: string;
  emptyFilterDescription: string;
  data: PlayerCountPoint[];
  filtered: PlayerCountPoint[];
  metricLabel: string;
  perGameLabel?: string;
  ariaTitle: string;
}) {
  return (
    <Section title={title}>
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={emptyFilterTitle}
          description={emptyFilterDescription}
        />
      ) : (
        <PlayerCountChart
          data={filtered}
          metricLabel={metricLabel}
          perGameLabel={perGameLabel}
          ariaTitle={ariaTitle}
        />
      )}
    </Section>
  );
}
