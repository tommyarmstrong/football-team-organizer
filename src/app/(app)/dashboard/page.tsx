import { Suspense } from "react";
import { getCurrentTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import { PitchGraphic } from "@/components/brand/pitch-graphic";
import { pageBodyClassName } from "@/components/shared/page-body";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SectionSkeleton } from "@/components/shared/skeleton";
import {
  DashboardCompetitions,
  DashboardFixtures,
  DashboardForm,
  DashboardLeaderboards,
  DashboardSeasonTiles,
} from "@/components/dashboard/dashboard-sections";

export default async function DashboardPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div className={pageBodyClassName("space-y-4")}>
        <PageHeader title="Dashboard" />
        <ErrorBanner message="No team found for your account." />
      </div>
    );
  }

  const displayName = teamDisplayName(team);

  return (
    <div className={pageBodyClassName("space-y-8")}>
      <div className="dashboard-title-card club-chrome relative overflow-hidden rounded-3xl px-5 py-6 shadow-lg sm:px-7 sm:py-8">
        <PitchGraphic className="dashboard-title-graphic pointer-events-none absolute -right-10 -bottom-12 h-44 w-auto sm:h-56" />
        <div className="relative space-y-1.5">
          <p className="dashboard-title-kicker inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            Dashboard
          </p>
          <h1 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
            {displayName}
          </h1>
          <p className="dashboard-title-season text-sm">{team.season_label}</p>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <DashboardSeasonTiles teamId={team.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DashboardFixtures
          teamId={team.id}
          teamName={displayName}
          clubId={team.club_id}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <DashboardForm teamId={team.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <DashboardCompetitions team={team} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={4} />}>
        <DashboardLeaderboards teamId={team.id} />
      </Suspense>
    </div>
  );
}
