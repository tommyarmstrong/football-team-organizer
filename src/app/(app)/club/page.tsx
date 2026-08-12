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
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { ClubHeaderMeta } from "@/components/clubs/club-header-meta";
import { ClubTeamsList } from "@/components/clubs/club-teams-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  return (
    <div className="space-y-8">
      <PageHeader
        title={club.name}
        description={<ClubHeaderMeta club={club} teams={teams} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>About {club.name}</CardTitle>
          {canEdit ? (
            <CardAction>
              <EditIconLink href="/club/edit" label="Edit club details" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {showTeams ? (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {teamsError ? <ErrorBanner message={teamsError} /> : null}
            {!teamsError && teams.length === 0 ? (
              <EmptyState
                title="No teams yet"
                description={
                  canEdit
                    ? "Add your first team for this club."
                    : "No teams are listed for this club yet."
                }
              />
            ) : null}
            {!teamsError && teams.length > 0 ? (
              <ClubTeamsList teams={teams} />
            ) : null}
            {canEdit ? (
              <Link href="/teams/new" className={buttonVariants()}>
                Add team
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
