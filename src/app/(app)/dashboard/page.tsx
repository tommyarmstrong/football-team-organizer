import { Suspense } from "react";
import { getCurrentTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
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
      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <DashboardSeasonTiles teamId={team.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <DashboardForm teamId={team.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DashboardFixtures
          teamId={team.id}
          teamName={displayName}
          clubId={team.club_id}
        />
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
