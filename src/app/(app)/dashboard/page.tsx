import { Suspense } from "react";
import { getCurrentTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import { PitchGraphic } from "@/components/brand/pitch-graphic";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { SectionSkeleton } from "@/components/shared/skeleton";
import {
  DashboardCompetitions,
  DashboardFixtures,
  DashboardForm,
  DashboardLeaderboards,
} from "@/components/dashboard/dashboard-sections";

export default async function DashboardPage() {
  const team = await getCurrentTeam();

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" />
        <ErrorBanner message="No team found for your account." />
      </div>
    );
  }

  const displayName = teamDisplayName(team);

  return (
    <div className="space-y-8">
      <div className="bg-pitch-deep text-header-foreground relative overflow-hidden rounded-3xl px-5 py-6 shadow-md sm:px-7 sm:py-8">
        <PitchGraphic className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-auto opacity-20 sm:h-56" />
        <p className="text-pitch-lime relative text-xs font-semibold tracking-[0.22em] uppercase">
          Dashboard
        </p>
        <h1 className="font-display relative mt-1 text-3xl leading-none tracking-tight sm:text-4xl">
          {displayName}
        </h1>
        <p className="relative mt-1.5 text-sm text-white/75">
          {team.season_label}
        </p>
      </div>

      <Suspense fallback={<SectionSkeleton columns={2} />}>
        <DashboardFixtures teamName={displayName} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={1} />}>
        <DashboardForm />
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
