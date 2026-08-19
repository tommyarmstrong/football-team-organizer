import dynamic from "next/dynamic";
import { getCurrentTeam } from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import {
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
  getResultsOverTime,
  type PlayerCountPoint,
} from "@/lib/data/stats";
import { teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Skeleton } from "@/components/shared/skeleton";
import { FormStrip } from "@/components/stats/form-strip";

const GoalsSection = dynamic(
  () =>
    import("@/components/stats/goals-section").then((mod) => mod.GoalsSection),
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

const ResultsOverTimeSection = dynamic(
  () =>
    import("@/components/stats/results-over-time-section").then(
      (mod) => mod.ResultsOverTimeSection,
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

  const [
    goalsByPlayer,
    assistsByPlayer,
    potmByPlayer,
    matchesPlayed,
    results,
    competitions,
  ] = await Promise.all([
    getGoalsByPlayerStats(),
    getAssistsByPlayerStats(),
    getPlayerOfTheMatchByPlayerStats(),
    getMatchesPlayedByPlayerStats(),
    getResultsOverTime(),
    listCompetitions(team.id),
  ]);

  const competitionOptions = competitions.data.map((competition) => ({
    id: competition.id,
    name: competition.name,
    kind: competition.kind,
  }));

  const errors = [
    goalsByPlayer.error,
    assistsByPlayer.error,
    potmByPlayer.error,
    matchesPlayed.error,
    results.error,
    competitions.error,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stats"
        description={`${teamDisplayName(team)} · ${team.season_label}`}
      />

      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}

      <Section
        title="Form"
        description="Most recent 8 played matches (oldest → newest)"
      >
        {results.form.length === 0 ? (
          <EmptyState
            title="No played matches"
            description="Form appears after you record results."
          />
        ) : (
          <FormStrip form={results.form} />
        )}
      </Section>

      <ResultsOverTimeSection
        data={results.data}
        competitions={competitionOptions}
      />

      <GoalsSection
        data={goalsByPlayer.data}
        competitions={competitionOptions}
      />

      <PlayerCountSection
        title="Assists by player"
        description="Assists recorded on our goals"
        emptyTitle="No assists yet"
        emptyDescription="Add assists on match detail pages to populate this chart."
        data={assistsByPlayer.data}
        metricLabel="Assists"
        perGameLabel="Assists per game"
        ariaTitle="assists by player"
      />

      <PlayerCountSection
        title="Player of the match by player"
        description="Coach and players' awards on played matches"
        emptyTitle="No awards yet"
        emptyDescription="Select players of the match on fixtures to populate this chart."
        data={potmByPlayer.data}
        metricLabel="Awards"
        ariaTitle="player of the match by player"
      />

      <PlayerCountSection
        title="Matches played by player"
        description="Appearances in match-day squads"
        emptyTitle="No squad appearances yet"
        emptyDescription="Add match-day squads to populate this chart."
        data={matchesPlayed.data}
        metricLabel="Matches"
        ariaTitle="matches played by player"
      />
    </div>
  );
}

function PlayerCountSection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  data,
  metricLabel,
  perGameLabel,
  ariaTitle,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  data: PlayerCountPoint[];
  metricLabel: string;
  perGameLabel?: string;
  ariaTitle: string;
}) {
  return (
    <Section title={title} description={description}>
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <PlayerCountChart
          data={data}
          metricLabel={metricLabel}
          perGameLabel={perGameLabel}
          ariaTitle={ariaTitle}
        />
      )}
    </Section>
  );
}
