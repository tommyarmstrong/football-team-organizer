import dynamic from "next/dynamic";
import { getCurrentTeam } from "@/lib/data/team";
import {
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
  getResultsOverTime,
} from "@/lib/data/stats";
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

const GoalsCard = dynamic(
  () => import("@/components/stats/goals-card").then((mod) => mod.GoalsCard),
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

  const [goalsByPlayer, assistsByPlayer, potmByPlayer, matchesPlayed, results] =
    await Promise.all([
      getGoalsByPlayerStats(),
      getAssistsByPlayerStats(),
      getPlayerOfTheMatchByPlayerStats(),
      getMatchesPlayedByPlayerStats(),
      getResultsOverTime(),
    ]);

  const errors = [
    goalsByPlayer.error,
    assistsByPlayer.error,
    potmByPlayer.error,
    matchesPlayed.error,
    results.error,
  ].filter(Boolean);

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

      <GoalsCard data={goalsByPlayer.data} />

      <Card>
        <CardHeader>
          <CardTitle>Assists by player</CardTitle>
          <CardDescription>Assists recorded on our goals</CardDescription>
        </CardHeader>
        <CardContent>
          {assistsByPlayer.data.length === 0 ? (
            <EmptyState
              title="No assists yet"
              description="Add assists on match detail pages to populate this chart."
            />
          ) : (
            <PlayerCountChart
              data={assistsByPlayer.data}
              metricLabel="Assists"
              ariaTitle="assists by player"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player of the match by player</CardTitle>
          <CardDescription>
            Coach and players&apos; awards on played matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {potmByPlayer.data.length === 0 ? (
            <EmptyState
              title="No awards yet"
              description="Select players of the match on fixtures to populate this chart."
            />
          ) : (
            <PlayerCountChart
              data={potmByPlayer.data}
              metricLabel="Awards"
              ariaTitle="player of the match by player"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matches played by player</CardTitle>
          <CardDescription>Appearances in match-day squads</CardDescription>
        </CardHeader>
        <CardContent>
          {matchesPlayed.data.length === 0 ? (
            <EmptyState
              title="No squad appearances yet"
              description="Add match-day squads to populate this chart."
            />
          ) : (
            <PlayerCountChart
              data={matchesPlayed.data}
              metricLabel="Matches"
              ariaTitle="matches played by player"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
