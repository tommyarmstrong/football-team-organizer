"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type {
  GoalsByPlayerPoint,
  PlayerCountPoint,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import {
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";
import { buildCountViewRows, countMetricLabel } from "@/lib/stats/count-view";
import {
  filterPlayerCountPoints,
  withPlayedAppearanceCounts,
} from "@/lib/stats/player-counts";
import type { GoalsMetric, GoalsPositionFilter } from "@/lib/stats/goals-view";
import { StatFilters } from "@/components/stats/stat-filters";
import {
  filterResults,
  tallyGoals,
  tallyResults,
} from "@/lib/stats/results-view";
import { SeasonTiles } from "@/components/stats/season-tiles";
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
  playerOfTheMonthByPlayer,
  matchesPlayed,
  results,
  competitions,
}: {
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  potmByPlayer: PlayerCountPoint[];
  playerOfTheMonthByPlayer: PlayerCountPoint[];
  matchesPlayed: PlayerCountPoint[];
  results: ResultOverTimePoint[];
  competitions: CompetitionFilterOption[];
}) {
  const [competitionId, setCompetitionId] = useState(ALL_COMPETITIONS);
  const [competitionKind, setCompetitionKind] = useState(ALL_LEAGUE_AND_CUP);

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
  const goalsForView = useMemo(
    () => withPlayedAppearanceCounts(goalsByPlayer, filteredAppearances),
    [filteredAppearances, goalsByPlayer],
  );
  const assistsForView = useMemo(
    () => withPlayedAppearanceCounts(filteredAssists, filteredAppearances),
    [filteredAppearances, filteredAssists],
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

      <SeasonTiles results={filteredResults} />

      <ResultPieCharts
        results={results}
        filteredResults={filteredResults}
        hasResultOutcomes={hasResultOutcomes}
        hasGoals={hasGoals}
        emptyFilterDescription={emptyFilterDescription}
      />

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

      {/* Awards are recorded per team, so competition filters do not change this chart. */}
      <PlayerCountSection
        title="Player of the month"
        emptyTitle="No awards yet"
        emptyDescription="Add player of the month awards from the Team page to populate this chart."
        emptyFilterTitle="No awards for this filter"
        data={playerOfTheMonthByPlayer}
        filtered={playerOfTheMonthByPlayer}
        metricLabel="Awards"
        ariaTitle="player of the month"
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

      <GoalsSection
        data={goalsForView}
        competitionId={competitionId}
        competitionKind={competitionKind}
      />

      <PlayerCountSection
        title="Assists"
        emptyTitle="No assists yet"
        emptyDescription="Add assists on match detail pages to populate this chart."
        emptyFilterTitle="No assists for this filter"
        data={assistsByPlayer}
        filtered={assistsForView}
        metricLabel="Assists"
        perGameLabel="Assists per game"
        ariaTitle="assists"
        emptyFilterDescription={emptyFilterDescription}
        metricNoun="Assists"
        metricAriaLabel="Assists metric"
        emptyViewTitle="No assists for this view"
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
        metricNoun="Matches"
        metricAriaLabel="Appearances metric"
        emptyViewTitle="No appearances for this view"
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
  metricNoun,
  metricAriaLabel,
  emptyViewTitle,
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
  metricNoun?: string;
  metricAriaLabel?: string;
  emptyViewTitle?: string;
}) {
  if (metricNoun && metricAriaLabel && emptyViewTitle) {
    return (
      <FilteredPlayerCountSection
        title={title}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        data={data}
        filtered={filtered}
        perGameLabel={perGameLabel}
        ariaTitle={ariaTitle}
        metricNoun={metricNoun}
        metricAriaLabel={metricAriaLabel}
        emptyViewTitle={emptyViewTitle}
      />
    );
  }

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

function FilteredPlayerCountSection({
  title,
  emptyTitle,
  emptyDescription,
  data,
  filtered,
  perGameLabel,
  ariaTitle,
  metricNoun,
  metricAriaLabel,
  emptyViewTitle,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  data: PlayerCountPoint[];
  filtered: PlayerCountPoint[];
  perGameLabel?: string;
  ariaTitle: string;
  metricNoun: string;
  metricAriaLabel: string;
  emptyViewTitle: string;
}) {
  const [positions, setPositions] = useState<GoalsPositionFilter[]>(["ALL"]);
  const [metric, setMetric] = useState<GoalsMetric>("total");
  const rows = useMemo(
    () => buildCountViewRows(filtered, positions, metric),
    [filtered, metric, positions],
  );

  return (
    <Section title={title}>
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-4">
          <StatFilters
            positions={positions}
            onPositionsChange={setPositions}
            metric={metric}
            onMetricChange={setMetric}
            metricAriaLabel={metricAriaLabel}
          />
          {rows.length === 0 ? (
            <EmptyState
              title={emptyViewTitle}
              description="Try another competition, position filter, or metric."
            />
          ) : (
            <PlayerCountChart
              data={rows}
              metricLabel={metricNoun}
              seriesLabel={countMetricLabel(metric, metricNoun)}
              perGameLabel={perGameLabel}
              ariaTitle={ariaTitle}
              allowDecimals={metric !== "total"}
              valueKey="value"
            />
          )}
        </div>
      )}
    </Section>
  );
}
