"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
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
import {
  buildCountViewRows,
  countMetricLabel,
  PERIOD_STARTS_METRIC_OPTIONS,
} from "@/lib/stats/count-view";
import {
  buildPeriodStartsViewRows,
  DEFAULT_PERIOD_TYPE_FILTER,
  filterPeriodStarts,
  PERIODS_PER_GAME_PERCENT_LABEL,
  type PeriodTypeFilter,
} from "@/lib/stats/period-starts-view";
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

const ResultsRingChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.ResultsRingChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const GoalsRingChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then((mod) => mod.GoalsRingChart),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

const PlayerLeaderChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.PlayerLeaderChart,
    ),
  {
    loading: () => <Skeleton className="h-72 w-full" />,
  },
);

/**
 * Two sections in a row on desktop, stacked on phones. `min-w-0` lets the
 * charts and filters shrink to the half-width column instead of overflowing.
 */
function SideBySide({ children }: { children: ReactNode }) {
  return (
    <div className="grid items-start gap-8 *:min-w-0 lg:grid-cols-2">
      {children}
    </div>
  );
}

function ResultRingCharts({
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
      <Section title="Results">
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
          <ResultsRingChart data={filteredResults} />
        )}
      </Section>

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
          <GoalsRingChart data={filteredResults} />
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
  periodStartsByPlayer,
  results,
  competitions,
}: {
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  potmByPlayer: PlayerCountPoint[];
  playerOfTheMonthByPlayer: PlayerCountPoint[];
  matchesPlayed: PlayerCountPoint[];
  /** Club managers only. Omit for everyone else and the section is not shown. */
  periodStartsByPlayer?: PlayerCountPoint[];
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

      <ResultRingCharts
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
      <SideBySide>
        <PlayerCountSection
          title="Player of the month"
          emptyTitle="No awards yet"
          emptyDescription="Add player of the month awards from the Team page to populate this chart."
          emptyFilterTitle="No awards for this filter"
          data={playerOfTheMonthByPlayer}
          filtered={playerOfTheMonthByPlayer}
          metricLabel="Awards"
          leaderboard
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
          leaderboard
          ariaTitle="coach's player of the match"
          emptyFilterDescription={emptyFilterDescription}
        />
      </SideBySide>

      <SideBySide>
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
          leaderboard
          ariaTitle="assists"
          emptyFilterDescription={emptyFilterDescription}
          metricNoun="Assists"
          metricAriaLabel="Assists metric"
          emptyViewTitle="No assists for this view"
        />
      </SideBySide>

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
        emptyViewTitle="No appearances for this view"
      />

      {periodStartsByPlayer ? (
        <PeriodStartsSection
          data={periodStartsByPlayer}
          competitionId={competitionId}
          competitionKind={competitionKind}
        />
      ) : null}
    </>
  );
}

/**
 * Club-manager-only Period starts. The page competition filters and the section's
 * own Type filter decide which starts (and which periods in the player's games)
 * count, so "Periods per game (%)" always compares like with like.
 */
function PeriodStartsSection({
  data,
  competitionId,
  competitionKind,
}: {
  data: PlayerCountPoint[];
  competitionId: string;
  competitionKind: string;
}) {
  const [positions, setPositions] = useState<GoalsPositionFilter[]>(["ALL"]);
  const [periodType, setPeriodType] = useState<PeriodTypeFilter>(
    DEFAULT_PERIOD_TYPE_FILTER,
  );
  const [metric, setMetric] = useState<GoalsMetric>("total");
  const rows = useMemo(
    () =>
      buildPeriodStartsViewRows(
        filterPeriodStarts(data, competitionId, competitionKind, periodType),
        positions,
        metric,
      ),
    [competitionId, competitionKind, data, metric, periodType, positions],
  );

  return (
    <Section title="Period starts">
      {data.length === 0 ? (
        <EmptyState
          title="No period starts yet"
          description="Add starting players to match periods to populate this chart."
        />
      ) : (
        <div className="space-y-4">
          <StatFilters
            positions={positions}
            onPositionsChange={setPositions}
            periodType={periodType}
            onPeriodTypeChange={setPeriodType}
            metric={metric}
            onMetricChange={setMetric}
            metricAriaLabel="Period starts metric"
            metricOptions={PERIOD_STARTS_METRIC_OPTIONS}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="No period starts for this view"
              description="Try another competition, position filter, type, or view."
            />
          ) : (
            <PlayerCountChart
              data={rows}
              metricLabel="Periods"
              seriesLabel={
                metric === "per_game"
                  ? PERIODS_PER_GAME_PERCENT_LABEL
                  : "Periods"
              }
              perGameLabel={PERIODS_PER_GAME_PERCENT_LABEL}
              perGameBasis="periods"
              percent={metric === "per_game"}
              allowDecimals={metric === "per_game"}
              valueKey="value"
              ariaTitle="period starts"
            />
          )}
        </div>
      )}
    </Section>
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
  leaderboard = false,
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
  /** Draw the report's leader bars instead of the bar chart and table. */
  leaderboard?: boolean;
  ariaTitle: string;
  /** With `emptyViewTitle`, adds the position filters, using this as the unit. */
  metricNoun?: string;
  /** Also adds the Total / Per game / Per period "View" filter. */
  metricAriaLabel?: string;
  emptyViewTitle?: string;
}) {
  if (metricNoun && emptyViewTitle) {
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
        leaderboard={leaderboard}
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
      ) : leaderboard ? (
        <PlayerLeaderChart data={filtered} unit={metricLabel.toLowerCase()} />
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
  leaderboard,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  data: PlayerCountPoint[];
  filtered: PlayerCountPoint[];
  perGameLabel?: string;
  ariaTitle: string;
  metricNoun: string;
  metricAriaLabel?: string;
  emptyViewTitle: string;
  leaderboard: boolean;
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
            metric={metricAriaLabel ? metric : undefined}
            onMetricChange={metricAriaLabel ? setMetric : undefined}
            metricAriaLabel={metricAriaLabel}
          />
          {rows.length === 0 ? (
            <EmptyState
              title={emptyViewTitle}
              description="Try another competition, position filter, or metric."
            />
          ) : leaderboard ? (
            <PlayerLeaderChart
              data={rows}
              unit={countMetricLabel(metric, metricNoun).toLowerCase()}
              allowDecimals={metric !== "total"}
              valueKey="value"
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
