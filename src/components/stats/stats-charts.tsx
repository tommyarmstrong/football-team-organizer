"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerCountPoint, ResultOverTimePoint } from "@/lib/data/stats";
import {
  cumulativeResults,
  tallyGoals,
  tallyResults,
} from "@/lib/stats/results-view";
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

export function ResultsOverTimeChart({
  data,
}: {
  data: ResultOverTimePoint[];
}) {
  const chartData = cumulativeResults(data).map((point) => ({
    ...point,
    shortLabel:
      point.label.length > 12 ? `${point.label.slice(0, 12)}…` : point.label,
  }));

  const summary = chartData
    .map(
      (row) =>
        `${row.date} vs ${row.label}: ${row.wins}W ${row.draws}D ${row.losses}L`,
    )
    .join("; ");

  return (
    <figure className={statsChartFrameClassName()}>
      <div
        className="h-72 w-full"
        role="img"
        aria-label={`Line chart of cumulative wins, draws, and losses. ${summary}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="shortLabel" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
            <Tooltip
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as
                  (typeof chartData)[number] | undefined;
                return row ? `${row.date} vs ${row.label}` : "";
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="wins"
              name="Wins"
              stroke="var(--color-win)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="draws"
              name="Draws"
              stroke="var(--color-draw)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="losses"
              name="Losses"
              stroke="var(--color-loss)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">Results: {summary}</figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <caption className="sr-only">Cumulative results</caption>
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th scope="col" className="py-2 pr-3 font-medium">
                Match
              </th>
              <th scope="col" className="py-2 pr-3 font-medium tabular-nums">
                Wins
              </th>
              <th scope="col" className="py-2 pr-3 font-medium tabular-nums">
                Draws
              </th>
              <th scope="col" className="py-2 font-medium tabular-nums">
                Losses
              </th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.matchId} className="border-border/60 border-b">
                <td className="py-2 pr-3">
                  {row.date} vs {row.label}
                </td>
                <td className="py-2 pr-3 tabular-nums">{row.wins}</td>
                <td className="py-2 pr-3 tabular-nums">{row.draws}</td>
                <td className="py-2 tabular-nums">{row.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
