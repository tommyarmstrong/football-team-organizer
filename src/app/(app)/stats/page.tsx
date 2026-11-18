import { Suspense } from "react";
import { getCurrentTeam } from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import { getAllTeamStats, getPeriodStartsByPlayer } from "@/lib/data/stats";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
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

  const description = `${teamDisplayName(team)} · ${team.season_label}`;

  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <PageHeader title="Stats" description={description} />
          <PageSkeleton rows={4} />
        </div>
      }
    >
      <StatsBody team={team} description={description} />
    </Suspense>
  );
}

export async function StatsBody({
  team,
  description = `${teamDisplayName(team)} · ${team.season_label}`,
}: {
  team: Team;
  description?: string;
}) {
  // §5.1 + §6.4 — Single composite RPC replaces 5 separate stat functions
  // (which collectively made ~11 DB queries). Now: 1 RPC + 1 competitions query.
  // Period starts are for club managers only, so other roles never fetch them.
  const ctx = await getViewerContext();
  const showPeriodStarts = ctx != null && canManageClub(ctx, team.club_id);
  const [stats, competitions, periodStarts] = await Promise.all([
    getAllTeamStats(team.id),
    listCompetitions(team.id),
    showPeriodStarts ? getPeriodStartsByPlayer(team.id) : null,
  ]);

  const competitionOptions = competitions.data.map((competition) => ({
    id: competition.id,
    name: competitionDisplayName(competition),
    kind: competition.kind,
  }));

  const errors = [stats.error, competitions.error, periodStarts?.error].filter(
    Boolean,
  );

  return (
    <div className="space-y-5">
      {errors.length > 0 ? <ErrorBanner message={errors.join(" ")} /> : null}
      <StatsPageContent
        teamId={team.id}
        headingDescription={description}
        goalsByPlayer={stats.goalsByPlayer}
        assistsByPlayer={stats.assistsByPlayer}
        potmByPlayer={stats.potmByPlayer}
        playerOfTheMonthByPlayer={stats.playerOfTheMonthByPlayer}
        matchesPlayed={stats.matchesPlayed}
        periodStartsByPlayer={periodStarts?.data}
        results={stats.resultsOverTime}
        competitions={competitionOptions}
      />
    </div>
  );
}
