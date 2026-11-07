"use client";

import type { PlayerCountPoint, ResultOverTimePoint } from "@/lib/data/stats";
import { tallyGoals, tallyResults } from "@/lib/stats/results-view";
import { cumulativePoints, pointsTooltip } from "@/lib/report/summary";
import { buildLeaderRows } from "@/lib/stats/leader-rows";
import {
  ChartTheme,
  GoalsDonut,
  GoalsLegend,
  GoalsPerMatch,
  LeaderBars,
  ResultsDonut,
  ResultsLegend,
} from "@/components/report/report-charts";
import { formatPeriodsPerGamePercent } from "@/lib/stats/period-starts-view";
import { PointsTrendWithTooltip } from "@/components/stats/points-trend-chart";
import { statsChartFrameClassName } from "@/components/stats/chart-frame";

/** What the leader bars need from each player. */
export type PlayerChartRow = Pick<
  PlayerCountPoint,
  "playerId" | "name" | "count"
> & { value?: number };

/**
 * Goals scored and conceded in every match, using the season report's
 * "Goals in every league and cup match" chart.
 */
export function GoalDifferenceChart({ data }: { data: ResultOverTimePoint[] }) {
  const matches = data.map((point) => ({
    id: point.matchId,
    goalsFor: point.goalsFor,
    goalsAgainst: point.goalsAgainst,
  }));
  const summary = data
    .map(
      (row) =>
        `${row.date} vs ${row.label}: ${row.goalsFor}-${row.goalsAgainst}`,
    )
    .join("; ");

  return (
    <figure className={statsChartFrameClassName()}>
      <ChartTheme>
        <GoalsPerMatch matches={matches} />
      </ChartTheme>
      <figcaption className="sr-only">
        Goals scored and conceded in each match: {summary}
      </figcaption>
    </figure>
  );
}

/**
 * Results through the season, using the report's cumulative points chart.
 * Hover a point, or tap it on a touch screen, to see the match.
 */
export function ResultsOverTimeChart({
  data,
}: {
  data: ResultOverTimePoint[];
}) {
  const matches = data.map((point) => ({
    id: point.matchId,
    date: point.date,
    opponent: point.label,
    goalsFor: point.goalsFor,
    goalsAgainst: point.goalsAgainst,
    result: point.result,
  }));
  const totals = cumulativePoints(matches);
  const summary = matches
    .map((m, i) => pointsTooltip(m, totals[i]!))
    .join("; ");

  return (
    <figure className={statsChartFrameClassName()}>
      <ChartTheme>
        <PointsTrendWithTooltip matches={matches} />
      </ChartTheme>
      <figcaption className="sr-only">
        Cumulative points through the season: {summary}
      </figcaption>
    </figure>
  );
}

/** Results as a ring with a legend, like the report's Season at a glance. */
export function ResultsRingChart({ data }: { data: ResultOverTimePoint[] }) {
  const tally = tallyResults(data);
  const summary = `Wins ${tally.wins}, draws ${tally.draws}, losses ${tally.losses}`;

  return (
    <figure className={statsChartFrameClassName()}>
      <ChartTheme className="flex items-center justify-center gap-[4mm] py-2">
        <div className="size-[38mm] shrink-0">
          <ResultsDonut tally={tally} />
        </div>
        <ResultsLegend tally={tally} />
      </ChartTheme>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

/** Goals scored and conceded as a ring with a legend. */
export function GoalsRingChart({ data }: { data: ResultOverTimePoint[] }) {
  const tally = tallyGoals(data);
  const summary = `Goals for ${tally.goalsFor}, goals against ${tally.goalsAgainst}`;

  return (
    <figure className={statsChartFrameClassName()}>
      <ChartTheme className="flex items-center justify-center gap-[4mm] py-2">
        <div className="size-[38mm] shrink-0">
          <GoalsDonut
            goalsFor={tally.goalsFor}
            goalsAgainst={tally.goalsAgainst}
          />
        </div>
        <GoalsLegend
          goalsFor={tally.goalsFor}
          goalsAgainst={tally.goalsAgainst}
        />
      </ChartTheme>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

/**
 * Per-player counts as the report's "Top scorers" / "Most assists" bars.
 * Players on zero are left out and the highest value comes first.
 */
export function PlayerLeaderChart({
  data,
  unit,
  allowDecimals = false,
  valueKey = "count",
  percent = false,
}: {
  data: PlayerChartRow[];
  /** What the numbers are, read out by screen readers ("goals"). */
  unit: string;
  allowDecimals?: boolean;
  valueKey?: "count" | "value";
  /** The plotted values are percents (0-100), e.g. periods per game (%). */
  percent?: boolean;
}) {
  const rows = buildLeaderRows(
    data.map((row) => ({
      playerId: row.playerId,
      name: row.name,
      value: valueKey === "value" && row.value != null ? row.value : row.count,
    })),
    percent ? formatPeriodsPerGamePercent : allowDecimals,
  );

  return (
    <figure className={statsChartFrameClassName()}>
      <ChartTheme>
        <LeaderBars
          rows={rows}
          unit={unit}
          emptyText={`No ${unit} recorded.`}
          nameWidth="min(40mm, 38%)"
          valueWidth={percent ? "16mm" : allowDecimals ? "13mm" : "9mm"}
        />
      </ChartTheme>
    </figure>
  );
}
