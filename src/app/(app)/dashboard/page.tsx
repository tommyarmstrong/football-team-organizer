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
  DashboardOverviewAndForm,
  DashboardPlayers,
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
    <div className={pageBodyClassName("space-y-8 lg:max-w-none")}>
      <Suspense fallback={<SectionSkeleton rows={2} />}>
        <DashboardOverviewAndForm teamId={team.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DashboardFixtures
          teamId={team.id}
          teamName={displayName}
          clubId={team.club_id}
        />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <Suspense fallback={<SectionSkeleton rows={2} />}>
            <DashboardCompetitions team={team} />
          </Suspense>
        </div>
        <div className="min-w-0">
          <Suspense fallback={<SectionSkeleton rows={4} />}>
            <DashboardPlayers teamId={team.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
