"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GoalsByPlayerPoint } from "@/lib/data/stats";
import {
  buildGoalsViewRows,
  GOALS_METRIC_OPTIONS,
  GOALS_POSITION_FILTERS,
  goalsMetricLabel,
  toggleGoalsPositionFilter,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FilterButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function GoalsCard({ data }: { data: GoalsByPlayerPoint[] }) {
  const [positions, setPositions] = useState<GoalsPositionFilter[]>(["ALL"]);
  const [metric, setMetric] = useState<GoalsMetric>("total");

  const rows = buildGoalsViewRows(data, positions, metric);
  const metricLabel = goalsMetricLabel(metric);
  const summary = rows
    .map((row) => `${row.name}: ${row.displayValue}`)
    .join("; ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <CardDescription>Our goals in played matches</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Add goals on match detail pages to populate this chart."
          />
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Position
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Position filters"
              >
                {GOALS_POSITION_FILTERS.map((value) => (
                  <FilterButton
                    key={value}
                    label={value}
                    pressed={positions.includes(value)}
                    onClick={() =>
                      setPositions((current) =>
                        toggleGoalsPositionFilter(current, value),
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                View
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Goals metric"
              >
                {GOALS_METRIC_OPTIONS.map((option) => (
                  <FilterButton
                    key={option.value}
                    label={option.label}
                    pressed={metric === option.value}
                    onClick={() => setMetric(option.value)}
                  />
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                title="No goals for this view"
                description="Try another position filter or metric."
              />
            ) : (
              <figure className="space-y-4">
                <div
                  className="h-72 w-full"
                  role="img"
                  aria-label={`Bar chart of ${metricLabel.toLowerCase()} by player. ${summary}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rows}
                      margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        allowDecimals={metric !== "total"}
                        tick={{ fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          metric === "total" ? value : value.toFixed(2),
                          metricLabel,
                        ]}
                      />
                      <Bar
                        dataKey="value"
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
                    <caption className="sr-only">
                      {metricLabel} by player
                    </caption>
                    <thead>
                      <tr className="border-border text-muted-foreground border-b">
                        <th scope="col" className="py-2 pr-3 font-medium">
                          Player
                        </th>
                        <th
                          scope="col"
                          className="py-2 font-medium tabular-nums"
                        >
                          {metricLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.playerId}
                          className="border-border/60 border-b"
                        >
                          <td className="py-2 pr-3">{row.name}</td>
                          <td className="py-2 tabular-nums">
                            {row.displayValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
