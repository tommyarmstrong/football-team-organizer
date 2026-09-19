import { redirect } from "next/navigation";
import {
  canAccessClubAndPeople,
  canManageClub,
  canViewClubTeams,
  getViewerContext,
} from "@/lib/authz/context";
import { getClub, getPrimaryClub } from "@/lib/data/clubs";
import { listCoaches } from "@/lib/data/coaches";
import { listVenues } from "@/lib/data/venues";
import {
  partitionTeamsByArchiveStatus,
  sortTeamsForDisplay,
} from "@/lib/team/season";
import { pageBodyClassName } from "@/components/shared/page-body";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/empty-state";
import { ClubHeaderMeta } from "@/components/clubs/club-header-meta";
import { ClubTeamsList } from "@/components/clubs/club-teams-list";
import { EditClubDialog } from "@/components/clubs/edit-club-dialog";
import { AddTeamDialog } from "@/components/team/add-team-dialog";

export default async function ClubPage() {
  const [ctx, summary] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
  ]);
  if (!ctx || !canAccessClubAndPeople(ctx)) {
    redirect("/dashboard");
  }

  const { data: club } = summary ? await getClub(summary.id) : { data: null };

  if (!club) {
    return (
      <div className={pageBodyClassName("space-y-8")}>
        <PageHeader title="Club" />
        <EmptyState
          title="No club found"
          description="Ask an administrator to link your account to a club."
        />
      </div>
    );
  }

  const canEdit = canManageClub(ctx, club.id);
  const showTeams = canViewClubTeams(ctx, club.id);
  const teams = sortTeamsForDisplay(
    ctx.visibleTeams.filter((t) => t.club_id === club.id),
  );
  const { current: currentTeams, archived: archivedTeams } =
    partitionTeamsByArchiveStatus(teams);

  let coaches: Awaited<ReturnType<typeof listCoaches>>["data"] = [];
  let clubVenues: Awaited<ReturnType<typeof listVenues>>["data"] = [];
  if (canEdit) {
    const [coachesResult, venuesResult] = await Promise.all([
      listCoaches(),
      listVenues(club.id),
    ]);
    coaches = coachesResult.data.filter((coach) => coach.club_id === club.id);
    clubVenues = venuesResult.data;
  }

  return (
    <div className={pageBodyClassName("space-y-8")}>
      <PageHeader
        title={club.name}
        description={<ClubHeaderMeta club={club} teams={teams} />}
      />

      <Section
        title={`About ${club.name}`}
        actions={canEdit ? <EditClubDialog club={club} /> : undefined}
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
            {currentTeams.length === 0 ? (
              <EmptyState
                title="No current teams"
                description={
                  canEdit
                    ? "Add your first team for this club, or open an archived season below."
                    : "No active teams are listed for this club yet."
                }
              />
            ) : (
              <ClubTeamsList teams={currentTeams} />
            )}
            {canEdit ? (
              <AddTeamDialog coaches={coaches} venues={clubVenues} />
            ) : null}
          </Section>

          <Section title="Archived teams">
            {archivedTeams.length === 0 ? (
              <EmptyState
                title="No archived teams"
                description="Finished seasons appear here once they are archived."
              />
            ) : (
              <ClubTeamsList
                teams={archivedTeams}
                filterPlaceholder="Filter archived teams by name or season…"
                emptyFilterTitle="No archived teams match"
                emptyFilterDescription="Try a different name or season, or clear the filter."
              />
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
