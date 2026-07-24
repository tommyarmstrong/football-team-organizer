import dynamic from "next/dynamic";
import { getCurrentTeam } from "@/lib/data/team";
import { getGoalsByPlayerStats, getResultsOverTime } from "@/lib/data/stats";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Skeleton } from "@/components/shared/skeleton";
import { FormStrip } from "@/components/stats/form-strip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GoalsByPlayerChart = dynamic(
  () =>
    import("@/components/stats/stats-charts").then(
      (mod) => mod.GoalsByPlayerChart,
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

export default async function StatsPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Stats" />
        <ErrorBanner message="No team found for your account." />
      </div>
    );
  }

  const [goalsByPlayer, results] = await Promise.all([
    getGoalsByPlayerStats(),
    getResultsOverTime(),
  ]);

  const errors = [goalsByPlayer.error, results.error].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stats"
        description={`${team.name} · ${team.season_label}`}
      />

      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>
            Recent results from played matches (oldest → newest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.form.length === 0 ? (
            <EmptyState
              title="No played matches"
              description="Form appears after you record results."
            />
          ) : (
            <FormStrip form={results.form} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals by player</CardTitle>
          <CardDescription>Our goals in played matches</CardDescription>
        </CardHeader>
        <CardContent>
          {goalsByPlayer.data.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Add goals on match detail pages to populate this chart."
            />
          ) : (
            <GoalsByPlayerChart data={goalsByPlayer.data} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results over time</CardTitle>
          <CardDescription>Goals for vs against by match</CardDescription>
        </CardHeader>
        <CardContent>
          {results.data.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="Played matches with scores will appear here."
            />
          ) : (
            <ResultsOverTimeChart data={results.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
