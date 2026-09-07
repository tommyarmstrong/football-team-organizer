import { Suspense } from "react";
import { getCurrentTeam } from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import {
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
  getResultsOverTime,
} from "@/lib/data/stats";
import { competitionDisplayName, teamDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageSkeleton } from "@/components/shared/skeleton";
import { StatsPageContent } from "@/components/stats/stats-page-content";
import type { Team } from "@/lib/supabase/database.types";

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stats"
        description={`${teamDisplayName(team)} · ${team.season_label}`}
      />
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <StatsBody team={team} />
      </Suspense>
    </div>
  );
}

export async function StatsBody({ team }: { team: Team }) {
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
    name: competitionDisplayName(competition),
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
    <>
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
      <StatsPageContent
        goalsByPlayer={goalsByPlayer.data}
        assistsByPlayer={assistsByPlayer.data}
        potmByPlayer={potmByPlayer.data}
        matchesPlayed={matchesPlayed.data}
        results={results.data}
        competitions={competitionOptions}
      />
    </>
  );
}
