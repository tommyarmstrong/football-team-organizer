"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type {
  GoalsByPlayerPoint,
  PlayerCountPoint,
  ResultOverTimePoint,
} from "@/lib/data/stats";
import type { CompetitionFilterOption } from "@/lib/stats/competition-filters";
import {
  ATTACKING_MODE_OPTIONS,
  attackingUnit,
  buildAttackingViewRows,
  type AttackingMode,
} from "@/lib/stats/attacking-view";
import { buildCountViewRows } from "@/lib/stats/count-view";
import {
  filterGoalsByCompetition,
  GOALS_METRIC_OPTIONS,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";
import {
  leaderboardCanExpand,
  visibleLeaderRows,
} from "@/lib/stats/leaderboard-window";
import {
  filterPlayerCountPoints,
  withPlayedAppearanceCounts,
} from "@/lib/stats/player-counts";
import {
  buildPeriodStartsViewRows,
  DEFAULT_PERIOD_TYPE_FILTER,
  filterPeriodStarts,
  PERIOD_TYPE_FILTER_OPTIONS,
  PERIODS_PER_GAME_PERCENT_LABEL,
  type PeriodTypeFilter,
} from "@/lib/stats/period-starts-view";
import {
  filterResults,
  tallyGoals,
  tallyResults,
} from "@/lib/stats/results-view";
import { RankedPlayerList } from "@/components/stats/ranked-player-list";
import { ShowAllToggle } from "@/components/stats/show-all-toggle";
import {
  StatsFilterChips,
  StatsFiltersButton,
} from "@/components/stats/stats-filters";
import { usePersistentStatsFilters } from "@/components/stats/use-stats-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

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
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Results" compact>
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

      <Section title="Goals" compact>
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
  teamId,
  headingDescription,
  goalsByPlayer,
  assistsByPlayer,
  potmByPlayer,
  playerOfTheMonthByPlayer,
  matchesPlayed,
  periodStartsByPlayer,
  results,
  competitions,
}: {
  teamId: string;
  headingDescription: string;
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
  const { filters, updateFilters } = usePersistentStatsFilters(
    teamId,
    competitions,
  );
  const { competitionId, competitionKind, positions } = filters;

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
    () =>
      withPlayedAppearanceCounts(
        filterGoalsByCompetition(goalsByPlayer, competitionId, competitionKind),
        filteredAppearances,
      ),
    [competitionId, competitionKind, filteredAppearances, goalsByPlayer],
  );
  const assistsForView = useMemo(
    () => withPlayedAppearanceCounts(filteredAssists, filteredAppearances),
    [filteredAppearances, filteredAssists],
  );
  const appearanceRows = useMemo(
    () => buildCountViewRows(filteredAppearances, positions, "total"),
    [filteredAppearances, positions],
  );

  const resultTally = tallyResults(filteredResults);
  const goalsTally = tallyGoals(filteredResults);
  const hasResults = filteredResults.length > 0;
  const hasResultOutcomes =
    resultTally.wins + resultTally.draws + resultTally.losses > 0;
  const hasGoals = goalsTally.goalsFor + goalsTally.goalsAgainst > 0;
  const emptyFilterDescription = "Try another competition or competition type.";
  const showFilters =
    results.length > 0 ||
    goalsByPlayer.length > 0 ||
    assistsByPlayer.length > 0 ||
    potmByPlayer.length > 0 ||
    matchesPlayed.length > 0 ||
    (periodStartsByPlayer?.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <PageHeader
          title="Stats"
          description={headingDescription}
          actions={
            showFilters ? (
              <StatsFiltersButton
                competitions={competitions}
                value={filters}
                onChange={updateFilters}
              />
            ) : null
          }
        />
        {showFilters ? (
          <StatsFilterChips
            competitions={competitions}
            value={filters}
            onChange={updateFilters}
          />
        ) : null}
      </div>

      <ResultRingCharts
        results={results}
        filteredResults={filteredResults}
        hasResultOutcomes={hasResultOutcomes}
        hasGoals={hasGoals}
        emptyFilterDescription={emptyFilterDescription}
      />

      <Section title="Results" compact>
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

      <Section title="Goals scored and conceded" compact>
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

      <AttackingStatsSection
        goalsByPlayer={goalsByPlayer}
        assistsByPlayer={assistsByPlayer}
        goalsForView={goalsForView}
        assistsForView={assistsForView}
        positions={positions}
      />

      {/* Monthly awards have no competition. Match awards do. Neither row
          carries a position, so the position filter is not applied here. */}
      <AwardsSection
        monthly={playerOfTheMonthByPlayer}
        potm={potmByPlayer}
        filteredPotm={filteredPotm}
        emptyFilterDescription={emptyFilterDescription}
      />

      <Section title="Appearances" compact>
        <CountLeaderboard
          sourceCount={matchesPlayed.length}
          rows={appearanceRows}
          emptyTitle="No squad appearances yet"
          emptyDescription="Add match-day squads to populate this chart."
          emptyViewTitle="No appearances for this view"
          unit="matches"
        />
      </Section>

      {periodStartsByPlayer ? (
        <PeriodStartsSection
          data={periodStartsByPlayer}
          competitionId={competitionId}
          competitionKind={competitionKind}
          positions={positions}
        />
      ) : null}
    </div>
  );
}

function AttackingStatsSection({
  goalsByPlayer,
  assistsByPlayer,
  goalsForView,
  assistsForView,
  positions,
}: {
  goalsByPlayer: GoalsByPlayerPoint[];
  assistsByPlayer: PlayerCountPoint[];
  goalsForView: GoalsByPlayerPoint[];
  assistsForView: PlayerCountPoint[];
  positions: GoalsPositionFilter[];
}) {
  const [mode, setMode] = useState<AttackingMode>("goals");
  const [metric, setMetric] = useState<GoalsMetric>("total");
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(
    () =>
      buildAttackingViewRows(
        goalsForView,
        assistsForView,
        positions,
        mode,
        metric,
      ),
    [assistsForView, goalsForView, metric, mode, positions],
  );
  const sourceCount =
    mode === "assists"
      ? assistsByPlayer.length
      : mode === "goals"
        ? goalsByPlayer.length
        : goalsByPlayer.length + assistsByPlayer.length;
  const copy = ATTACKING_EMPTY[mode];

  return (
    <Section
      title="Attacking stats"
      compact
      actions={
        <NativeSelect
          aria-label="Attacking stat view"
          className="h-11 w-auto"
          value={metric}
          onChange={(event) => {
            setMetric(event.target.value as GoalsMetric);
            setExpanded(false);
          }}
        >
          {GOALS_METRIC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      }
    >
      <div className="space-y-3">
        <div
          className="grid grid-cols-3 gap-2"
          role="group"
          aria-label="Attacking stat"
        >
          {ATTACKING_MODE_OPTIONS.map((option) => {
            const pressed = option.value === mode;
            return (
              <Button
                key={option.value}
                type="button"
                variant={pressed ? "default" : "outline"}
                className="h-11 w-full"
                aria-pressed={pressed}
                onClick={() => {
                  setMode(option.value);
                  setExpanded(false);
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
        {sourceCount === 0 ? (
          <EmptyState title={copy.title} description={copy.description} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={copy.viewTitle}
            description="Try another competition, competition type, or position."
          />
        ) : (
          <LeaderboardChart
            rows={rows}
            expanded={expanded}
            onToggle={() => setExpanded((open) => !open)}
            unit={attackingUnit(mode, metric)}
            allowDecimals={metric !== "total"}
          />
        )}
      </div>
    </Section>
  );
}

const ATTACKING_EMPTY: Record<
  AttackingMode,
  { title: string; description: string; viewTitle: string }
> = {
  goals: {
    title: "No goals yet",
    description: "Add goals on match detail pages to populate this chart.",
    viewTitle: "No goals for this view",
  },
  assists: {
    title: "No assists yet",
    description: "Add assists on match detail pages to populate this chart.",
    viewTitle: "No assists for this view",
  },
  involvements: {
    title: "No goals or assists yet",
    description:
      "Add goals and assists on match detail pages to populate this chart.",
    viewTitle: "No attacking stats for this view",
  },
};

function AwardsSection({
  monthly,
  potm,
  filteredPotm,
  emptyFilterDescription,
}: {
  monthly: PlayerCountPoint[];
  potm: PlayerCountPoint[];
  filteredPotm: PlayerCountPoint[];
  emptyFilterDescription: string;
}) {
  const [view, setView] = useState<"month" | "match">("month");
  const views = [
    {
      id: "month" as const,
      label: "Player of the month",
      sourceCount: monthly.length,
      rows: monthly,
      emptyTitle: "No awards yet",
      emptyDescription:
        "Add player of the month awards from the Team page to populate this list.",
      filteredOut: false,
    },
    {
      id: "match" as const,
      label: "Player of the match",
      sourceCount: potm.length,
      rows: filteredPotm,
      emptyTitle: "No awards yet",
      emptyDescription:
        "Select the coach's player of the match on fixtures to populate this list.",
      filteredOut: potm.length > 0 && filteredPotm.length === 0,
    },
  ];
  const active = views.find((item) => item.id === view) ?? views[0]!;

  return (
    <Section title="Awards" compact>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Awards">
          {views.map((item) => {
            const pressed = item.id === view;
            return (
              <Button
                key={item.id}
                type="button"
                variant={pressed ? "default" : "outline"}
                className="h-11"
                aria-pressed={pressed}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
        <AwardList
          key={active.id}
          sourceCount={active.sourceCount}
          rows={active.rows}
          emptyTitle={active.emptyTitle}
          emptyDescription={active.emptyDescription}
          filteredOut={active.filteredOut}
          emptyFilterDescription={emptyFilterDescription}
        />
      </div>
    </Section>
  );
}

function AwardList({
  sourceCount,
  rows,
  emptyTitle,
  emptyDescription,
  filteredOut,
  emptyFilterDescription,
}: {
  sourceCount: number;
  rows: PlayerCountPoint[];
  emptyTitle: string;
  emptyDescription: string;
  filteredOut: boolean;
  emptyFilterDescription: string;
}) {
  const [expanded, setExpanded] = useState(false);
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
  const visible = visibleLeaderRows(rows, expanded);
  return (
    <div className="space-y-2">
      <RankedPlayerList rows={visible} unit="awards" />
      {leaderboardCanExpand(rows.length) ? (
        <ShowAllToggle
          expanded={expanded}
          onToggle={() => setExpanded((open) => !open)}
        />
      ) : null}
    </div>
  );
}

function CountLeaderboard({
  sourceCount,
  rows,
  emptyTitle,
  emptyDescription,
  emptyViewTitle,
  unit,
}: {
  sourceCount: number;
  rows: Array<{ playerId: string; name: string; count: number; value: number }>;
  emptyTitle: string;
  emptyDescription: string;
  emptyViewTitle: string;
  unit: string;
}) {
  if (sourceCount === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyViewTitle}
        description="Try another competition, competition type, or position."
      />
    );
  }
  return <LeaderboardChart rows={rows} unit={unit} />;
}

function LeaderboardChart({
  rows,
  unit,
  allowDecimals = false,
  percent = false,
  expanded: expandedProp,
  onToggle,
}: {
  rows: Array<{
    playerId: string;
    name: string;
    count: number;
    value?: number;
  }>;
  unit: string;
  allowDecimals?: boolean;
  percent?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [expandedState, setExpandedState] = useState(false);
  const expanded = expandedProp ?? expandedState;
  const toggle = onToggle ?? (() => setExpandedState((open) => !open));
  const visible = visibleLeaderRows(rows, expanded);

  return (
    <div className="space-y-2">
      <PlayerLeaderChart
        data={visible}
        unit={unit}
        allowDecimals={allowDecimals}
        percent={percent}
        valueKey="value"
      />
      {leaderboardCanExpand(rows.length) ? (
        <ShowAllToggle expanded={expanded} onToggle={toggle} />
      ) : null}
    </div>
  );
}

/**
 * Club-manager-only Period starts. Position comes from the page filters.
 * Type and the periods / per-game view stay here, because they belong to
 * this statistic alone.
 */
function PeriodStartsSection({
  data,
  competitionId,
  competitionKind,
  positions,
}: {
  data: PlayerCountPoint[];
  competitionId: string;
  competitionKind: string;
  positions: GoalsPositionFilter[];
}) {
  const [periodType, setPeriodType] = useState<PeriodTypeFilter>(
    DEFAULT_PERIOD_TYPE_FILTER,
  );
  const [metric, setMetric] = useState<GoalsMetric>("total");
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
    <Section title="Period starts" compact>
      {data.length === 0 ? (
        <EmptyState
          title="No period starts yet"
          description="Add starting players to match periods to populate this chart."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              aria-label="Period type"
              className="h-11 w-auto"
              value={periodType}
              onChange={(event) =>
                setPeriodType(event.target.value as PeriodTypeFilter)
              }
            >
              {PERIOD_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Period starts view"
              className="h-11 w-auto"
              value={metric}
              onChange={(event) => setMetric(event.target.value as GoalsMetric)}
            >
              <option value="total">Periods</option>
              <option value="per_game">Per game</option>
            </NativeSelect>
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title="No period starts for this view"
              description="Try another competition, position filter, or type."
            />
          ) : (
            <LeaderboardChart
              rows={rows}
              unit={
                perGame
                  ? PERIODS_PER_GAME_PERCENT_LABEL.toLowerCase()
                  : "periods"
              }
              percent={perGame}
              allowDecimals={perGame}
            />
          )}
        </div>
      )}
    </Section>
  );
}
