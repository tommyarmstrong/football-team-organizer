"use client";

import {
  Bar,
  BarChart,
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

export function PlayerCountChart({
  data,
  metricLabel,
  ariaTitle,
}: {
  data: PlayerCountPoint[];
  metricLabel: string;
  ariaTitle: string;
}) {
  const summary = data.map((row) => `${row.name}: ${row.count}`).join("; ");

  return (
    <figure className="space-y-4">
      <div
        className="h-72 w-full"
        role="img"
        aria-label={`Bar chart of ${ariaTitle}. ${summary}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
            <Tooltip />
            <Bar
              dataKey="count"
              name={metricLabel}
              fill="var(--color-foreground)"
              radius={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {metricLabel} by player: {summary}
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[16rem] text-left text-sm">
          <caption className="sr-only">{metricLabel} by player</caption>
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th scope="col" className="py-2 pr-3 font-medium">
                Player
              </th>
              <th scope="col" className="py-2 font-medium tabular-nums">
                {metricLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.playerId} className="border-border/60 border-b">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 tabular-nums">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function ResultsOverTimeChart({
  data,
}: {
  data: ResultOverTimePoint[];
}) {
  const chartData = data.map((point, index) => ({
    ...point,
    index: index + 1,
    shortLabel:
      point.label.length > 12 ? `${point.label.slice(0, 12)}…` : point.label,
  }));

  const summary = data
    .map(
      (row) =>
        `${row.date} vs ${row.label}: ${row.goalsFor}–${row.goalsAgainst}`,
    )
    .join("; ");

  return (
    <figure className="space-y-4">
      <div
        className="h-72 w-full"
        role="img"
        aria-label={`Line chart of goals for and against over time. ${summary}`}
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
                  ResultOverTimePoint | undefined;
                return row ? `${row.date} vs ${row.label}` : "";
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="goalsFor"
              name="Goals for"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="goalsAgainst"
              name="Goals against"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">Results over time: {summary}</figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <caption className="sr-only">Results over time</caption>
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th scope="col" className="py-2 pr-3 font-medium">
                Match
              </th>
              <th scope="col" className="py-2 pr-3 font-medium tabular-nums">
                For
              </th>
              <th scope="col" className="py-2 font-medium tabular-nums">
                Against
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.matchId} className="border-border/60 border-b">
                <td className="py-2 pr-3">
                  {row.date} vs {row.label}
                </td>
                <td className="py-2 pr-3 tabular-nums">{row.goalsFor}</td>
                <td className="py-2 tabular-nums">{row.goalsAgainst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
