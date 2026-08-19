import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canAccessClubAndPeople,
  canManageClub,
  canViewClubTeams,
  getViewerContext,
} from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listVisibleTeams } from "@/lib/data/team";
import { partitionTeamsByArchiveStatus } from "@/lib/team/season";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { ClubHeaderMeta } from "@/components/clubs/club-header-meta";
import { ClubTeamsList } from "@/components/clubs/club-teams-list";
import { buttonVariants } from "@/components/ui/button";

export default async function ClubPage() {
  const ctx = await getViewerContext();
  if (!ctx || !canAccessClubAndPeople(ctx)) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();

  if (!club) {
    return (
      <div className="space-y-8">
        <PageHeader title="Club" />
        <EmptyState
          title="No club found"
          description="Create a club from the no-access page, or ask an administrator for help."
        />
      </div>
    );
  }

  const canEdit = canManageClub(ctx, club.id);
  const showTeams = canViewClubTeams(ctx, club.id);
  const { data: allTeams, error: teamsError } = await listVisibleTeams();
  const teams = allTeams.filter((t) => t.club_id === club.id);
  const { current: currentTeams, archived: archivedTeams } =
    partitionTeamsByArchiveStatus(teams);

  return (
    <div className="space-y-8">
      <PageHeader
        title={club.name}
        description={<ClubHeaderMeta club={club} teams={teams} />}
      />

      <Section
        title={`About ${club.name}`}
        actions={
          canEdit ? (
            <EditIconLink href="/club/edit" label="Edit club details" />
          ) : undefined
        }
      >
        {club.about ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {club.about}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            {canEdit
              ? "No club philosophy yet. Add one when you edit club details."
              : "No club philosophy yet."}
          </p>
        )}
      </Section>

      {showTeams ? (
        <>
          <Section title="Current teams">
            {teamsError ? <ErrorBanner message={teamsError} /> : null}
            {!teamsError && currentTeams.length === 0 ? (
              <EmptyState
                title="No current teams"
                description={
                  canEdit
                    ? "Add your first team for this club, or open an archived season below."
                    : "No active teams are listed for this club yet."
                }
              />
            ) : null}
            {!teamsError && currentTeams.length > 0 ? (
              <ClubTeamsList teams={currentTeams} />
            ) : null}
            {canEdit ? (
              <Link href="/teams/new" className={buttonVariants()}>
                Add team
              </Link>
            ) : null}
          </Section>

          <Section title="Archived teams">
            {teamsError ? <ErrorBanner message={teamsError} /> : null}
            {!teamsError && archivedTeams.length === 0 ? (
              <EmptyState
                title="No archived teams"
                description="Finished seasons appear here once they are archived."
              />
            ) : null}
            {!teamsError && archivedTeams.length > 0 ? (
              <ClubTeamsList
                teams={archivedTeams}
                filterPlaceholder="Filter archived teams by name or season…"
                emptyFilterTitle="No archived teams match"
                emptyFilterDescription="Try a different name or season, or clear the filter."
              />
            ) : null}
          </Section>
        </>
      ) : null}
    </div>
  );
}
