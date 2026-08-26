import { getCurrentTeam } from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import {
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
  getResultsOverTime,
} from "@/lib/data/stats";
import { teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { StatsPageContent } from "@/components/stats/stats-page-content";

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

      <StatsPageContent
        goalsByPlayer={goalsByPlayer.data}
        assistsByPlayer={assistsByPlayer.data}
        potmByPlayer={potmByPlayer.data}
        matchesPlayed={matchesPlayed.data}
        results={results.data}
        competitions={competitionOptions}
      />
    </div>
  );
}
