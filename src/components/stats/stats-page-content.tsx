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
import {
  buildGoalsViewRows,
  goalsMetricLabel,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";
import { StatFilters } from "@/components/stats/stat-filters";
import {
  filterResults,
  tallyGoals,
  tallyResults,
} from "@/lib/stats/results-view";
import { StatsCompetitionFilters } from "@/components/stats/stats-competition-filters";
import { DashboardViewSwitch } from "@/components/dashboard/dashboard-view-switch";
import { EmptyState } from "@/components/shared/empty-state";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/shared/skeleton";

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
  const [positions, setPositions] = useState<GoalsPositionFilter[]>(["ALL"]);
  const [metric, setMetric] = useState<GoalsMetric>("total");

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
  const goalRows = useMemo(
    () =>
      buildGoalsViewRows(
        goalsForView,
        positions,
        metric,
        competitionId,
        competitionKind,
      ),
    [competitionId, competitionKind, goalsForView, metric, positions],
  );
  const assistRows = useMemo(
    () => buildCountViewRows(assistsForView, positions, metric),
    [assistsForView, metric, positions],
  );
  const appearanceRows = useMemo(
    () => buildCountViewRows(filteredAppearances, positions, metric),
    [filteredAppearances, metric, positions],
  );

  const resultTally = tallyResults(filteredResults);
  const goalsTally = tallyGoals(filteredResults);
  const hasResults = filteredResults.length > 0;
  const hasResultOutcomes =
    resultTally.wins + resultTally.draws + resultTally.losses > 0;
  const hasGoals = goalsTally.goalsFor + goalsTally.goalsAgainst > 0;
  const emptyFilterDescription = "Try another competition or competition type.";
  const showCompetitionFilters =
    results.length > 0 ||
    goalsByPlayer.length > 0 ||
    assistsByPlayer.length > 0 ||
    potmByPlayer.length > 0 ||
    matchesPlayed.length > 0;
  const showPlayerFilters =
    goalsByPlayer.length > 0 ||
    assistsByPlayer.length > 0 ||
    matchesPlayed.length > 0 ||
    (periodStartsByPlayer?.length ?? 0) > 0;

  return (
    <>
      {showCompetitionFilters ? (
        <StatsCompetitionFilters
          idPrefix="stats"
          competitions={competitions}
          competitionId={competitionId}
          competitionKind={competitionKind}
          onCompetitionIdChange={setCompetitionId}
          onCompetitionKindChange={setCompetitionKind}
        />
      ) : null}

      {showPlayerFilters ? (
        <StatFilters
          positions={positions}
          onPositionsChange={setPositions}
          metric={metric}
          onMetricChange={setMetric}
          metricAriaLabel="Stats view"
        />
      ) : null}

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

      {/* Monthly awards are recorded per team, so competition filters do not change that chart. */}
      <DashboardViewSwitch
        title="Awards"
        views={[
          {
            id: "month",
            label: "Player of the month",
            content: (
              <AwardChart
                sourceCount={playerOfTheMonthByPlayer.length}
                rows={playerOfTheMonthByPlayer}
                emptyTitle="No awards yet"
                emptyDescription="Add player of the month awards from the Team page to populate this chart."
              />
            ),
          },
          {
            id: "match",
            label: "Player of the match",
            content: (
              <AwardChart
                sourceCount={potmByPlayer.length}
                rows={filteredPotm}
                emptyTitle="No awards yet"
                emptyDescription="Select the coach's player of the match on fixtures to populate this chart."
                filteredOut={
                  potmByPlayer.length > 0 && filteredPotm.length === 0
                }
                emptyFilterDescription={emptyFilterDescription}
              />
            ),
          },
        ]}
      />

      <DashboardViewSwitch
        title="Players"
        views={[
          {
            id: "goals",
            label: "Goals",
            content: (
              <CountChart
                sourceCount={goalsByPlayer.length}
                rows={goalRows}
                emptyTitle="No goals yet"
                emptyDescription="Add goals on match detail pages to populate this chart."
                emptyViewTitle="No goals for this view"
                unit={goalsMetricLabel(metric).toLowerCase()}
                allowDecimals={metric !== "total"}
              />
            ),
          },
          {
            id: "assists",
            label: "Assists",
            content: (
              <CountChart
                sourceCount={assistsByPlayer.length}
                rows={assistRows}
                emptyTitle="No assists yet"
                emptyDescription="Add assists on match detail pages to populate this chart."
                emptyViewTitle="No assists for this view"
                unit={countMetricLabel(metric, "Assists").toLowerCase()}
                allowDecimals={metric !== "total"}
              />
            ),
          },
          {
            id: "appearances",
            label: "Appearances",
            content: (
              <CountChart
                sourceCount={matchesPlayed.length}
                rows={appearanceRows}
                emptyTitle="No squad appearances yet"
                emptyDescription="Add match-day squads to populate this chart."
                emptyViewTitle="No appearances for this view"
                unit={countMetricLabel(metric, "Matches").toLowerCase()}
                allowDecimals={metric !== "total"}
              />
            ),
          },
        ]}
      />

      {periodStartsByPlayer ? (
        <PeriodStartsSection
          data={periodStartsByPlayer}
          competitionId={competitionId}
          competitionKind={competitionKind}
          positions={positions}
          metric={metric}
        />
      ) : null}
    </>
  );
}

/**
 * Club-manager-only Period starts. Position and View come from the page.
 * Type stays here. "Per period" is a rate for goals, assists and appearances,
 * so that view keeps the periods total.
 */
function PeriodStartsSection({
  data,
  competitionId,
  competitionKind,
  positions,
  metric,
}: {
  data: PlayerCountPoint[];
  competitionId: string;
  competitionKind: string;
  positions: GoalsPositionFilter[];
  metric: GoalsMetric;
}) {
  const [periodType, setPeriodType] = useState<PeriodTypeFilter>(
    DEFAULT_PERIOD_TYPE_FILTER,
  );
  const rows = useMemo(
    () =>
      buildPeriodStartsViewRows(
        filterPeriodStarts(data, competitionId, competitionKind, periodType),
        positions,
        metric === "per_game" ? "per_game" : "total",
      ),
    [competitionId, competitionKind, data, metric, periodType, positions],
  );
  const perGame = metric === "per_game";

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
            periodType={periodType}
            onPeriodTypeChange={setPeriodType}
          />
          {rows.length === 0 ? (
            <EmptyState
              title="No period starts for this view"
              description="Try another competition, position filter, type, or view."
            />
          ) : (
            <PlayerLeaderChart
              data={rows}
              unit={
                perGame
                  ? PERIODS_PER_GAME_PERCENT_LABEL.toLowerCase()
                  : "periods"
              }
              percent={perGame}
              allowDecimals={perGame}
              valueKey="value"
            />
          )}
        </div>
      )}
    </Section>
  );
}

function CountChart({
  sourceCount,
  rows,
  emptyTitle,
  emptyDescription,
  emptyViewTitle,
  unit,
  allowDecimals,
}: {
  sourceCount: number;
  rows: Array<{ playerId: string; name: string; count: number; value: number }>;
  emptyTitle: string;
  emptyDescription: string;
  emptyViewTitle: string;
  unit: string;
  allowDecimals: boolean;
}) {
  if (sourceCount === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyViewTitle}
        description="Try another competition, position filter, or view."
      />
    );
  }
  return (
    <PlayerLeaderChart
      data={rows}
      unit={unit}
      allowDecimals={allowDecimals}
      valueKey="value"
    />
  );
}

function AwardChart({
  sourceCount,
  rows,
  emptyTitle,
  emptyDescription,
  filteredOut = false,
  emptyFilterDescription,
}: {
  sourceCount: number;
  rows: PlayerCountPoint[];
  emptyTitle: string;
  emptyDescription: string;
  filteredOut?: boolean;
  emptyFilterDescription?: string;
}) {
  if (sourceCount === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  if (filteredOut || rows.length === 0) {
    return (
      <EmptyState
        title="No awards for this filter"
        description={emptyFilterDescription}
      />
    );
  }
  return <PlayerLeaderChart data={rows} unit="awards" />;
}
