"use client";

import { useState } from "react";
import type { GoalsByPlayerPoint } from "@/lib/data/stats";
import {
  buildGoalsViewRows,
  goalsMetricLabel,
  type GoalsMetric,
  type GoalsPositionFilter,
} from "@/lib/stats/goals-view";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
} from "@/lib/stats/competition-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Section } from "@/components/shared/section";
import { PlayerLeaderChart } from "@/components/stats/stats-charts";
import { StatFilters } from "@/components/stats/stat-filters";

export function GoalsSection({
  data,
  competitionId = ALL_COMPETITIONS,
  competitionKind = ALL_COMPETITION_KINDS,
}: {
  data: GoalsByPlayerPoint[];
  competitionId?: string;
  competitionKind?: string;
}) {
  const [positions, setPositions] = useState<GoalsPositionFilter[]>(["ALL"]);
  const [metric, setMetric] = useState<GoalsMetric>("total");

  const rows = buildGoalsViewRows(
    data,
    positions,
    metric,
    competitionId,
    competitionKind,
  );
  const metricLabel = goalsMetricLabel(metric);

  return (
    <Section title="Goals">
      <div className="space-y-4">
        {data.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Add goals on match detail pages to populate this chart."
          />
        ) : (
          <>
            <StatFilters
              positions={positions}
              onPositionsChange={setPositions}
              metric={metric}
              onMetricChange={setMetric}
              metricAriaLabel="Goals metric"
            />

            {rows.length === 0 ? (
              <EmptyState
                title="No goals for this view"
                description="Try another competition, position filter, or metric."
              />
            ) : (
              <PlayerLeaderChart
                data={rows}
                unit={metricLabel.toLowerCase()}
                allowDecimals={metric !== "total"}
                valueKey="value"
              />
            )}
          </>
        )}
      </div>
    </Section>
  );
}
