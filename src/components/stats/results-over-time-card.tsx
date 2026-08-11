"use client";

import { useMemo, useState } from "react";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  matchesCompetitionFilters,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";
import { StatsCompetitionFilters } from "@/components/stats/stats-competition-filters";
import { ResultsOverTimeChart } from "@/components/stats/stats-charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResultsOverTimeCard({
  data,
  competitions,
}: {
  data: ResultOverTimePoint[];
  competitions: CompetitionFilterOption[];
}) {
  const [competitionId, setCompetitionId] = useState(ALL_COMPETITIONS);
  const [competitionKind, setCompetitionKind] = useState(ALL_COMPETITION_KINDS);

  const filtered = useMemo(
    () =>
      data.filter((point) =>
        matchesCompetitionFilters({
          competitionId: point.competitionId,
          competitionKind: point.competitionKind,
          selectedCompetitionId: competitionId,
          selectedCompetitionKind: competitionKind,
        }),
      ),
    [competitionId, competitionKind, data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results over time</CardTitle>
        <CardDescription>Goals for vs against by match</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Played matches with scores will appear here."
          />
        ) : (
          <>
            <StatsCompetitionFilters
              idPrefix="results"
              competitions={competitions}
              competitionId={competitionId}
              competitionKind={competitionKind}
              onCompetitionIdChange={setCompetitionId}
              onCompetitionKindChange={setCompetitionKind}
            />
            {filtered.length === 0 ? (
              <EmptyState
                title="No results for this filter"
                description="Try another competition or competition type."
              />
            ) : (
              <ResultsOverTimeChart data={filtered} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
