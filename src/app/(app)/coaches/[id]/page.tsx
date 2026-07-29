import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoach, getCoachTeams } from "@/lib/data/coaches";
import { listCoachObjectives } from "@/lib/data/coach-objectives";
import { getViewerContext, isClubStaff } from "@/lib/authz/context";
import { coachDisplayName, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachForm } from "@/components/coaches/coach-form";
import { CoachObjectivesSection } from "@/components/coaches/coach-objectives-section";
import { CoachTeamsSection } from "@/components/coaches/coach-teams-section";
import { DeleteCoachButton } from "@/components/coaches/delete-coach-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: coach, error } = await getCoach(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Coach" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!coach || !ctx) {
    notFound();
  }

  const [{ data: teams }, { data: objectives }] = await Promise.all([
    getCoachTeams(coach.id),
    listCoachObjectives(coach.id),
  ]);

  const canEdit = isClubStaff(ctx, coach.club_id);
  const currentTeamIds = new Set(teams.map((t) => t.team_id));
  const availableTeams = ctx.visibleTeams.filter(
    (team) =>
      team.club_id === coach.club_id &&
      ctx.editableTeamIds.includes(team.id) &&
      !currentTeamIds.has(team.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={coachDisplayName(coach)}
        description={[
          `Joined ${formatShortDate(coach.joined_date)}`,
          coach.date_of_birth
            ? `DOB ${formatShortDate(coach.date_of_birth)}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/coaches" />}>
            Back to coaches
          </Button>
        }
      />

      {coach.biography ? (
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{coach.biography}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Teams this coach is assigned to within the club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachTeamsSection
            coachId={coach.id}
            memberships={teams}
            availableTeams={availableTeams}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Development objectives</CardTitle>
          <CardDescription>
            Optional goals for this coach&apos;s development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachObjectivesSection
            coachId={coach.id}
            objectives={objectives}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit coach</CardTitle>
            <CardDescription>
              Update contact details, biography, and qualifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CoachForm mode="edit" coach={coach} />
            <DeleteCoachButton coachId={coach.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
