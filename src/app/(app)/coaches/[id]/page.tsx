import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoach, getCoachTeams } from "@/lib/data/coaches";
import { listCoachObjectives } from "@/lib/data/coach-objectives";
import { getViewerContext, isClubStaff } from "@/lib/authz/context";
import { coachDisplayName, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachObjectivesSection } from "@/components/coaches/coach-objectives-section";
import { CoachTeamsSection } from "@/components/coaches/coach-teams-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

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

  const joinedLine = [
    `Joined ${formatShortDate(coach.joined_date)}`,
    coach.date_of_birth ? `DOB ${formatShortDate(coach.date_of_birth)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const qualificationsLine = [
    `DBS: ${yesNo(coach.dbs_checked)}`,
    `FA1: ${yesNo(coach.fa_level_1)}`,
    `FA2: ${yesNo(coach.fa_level_2)}`,
  ].join(" · ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={coachDisplayName(coach)}
        description={
          <div className="space-y-1">
            <p>{joinedLine}</p>
            <p>{qualificationsLine}</p>
          </div>
        }
        actions={
          <>
            {canEdit ? (
              <Link
                href={`/coaches/${coach.id}/edit`}
                className={buttonVariants({ size: "sm" })}
              >
                Edit
              </Link>
            ) : null}
            <Link
              href="/coaches"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to coaches
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Biography</CardTitle>
        </CardHeader>
        <CardContent>
          {coach.biography ? (
            <p className="text-sm whitespace-pre-wrap">{coach.biography}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No biography recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          {coach.philosophy ? (
            <p className="text-sm whitespace-pre-wrap">{coach.philosophy}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No philosophy recorded.
            </p>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {coach.notes ? (
            <p className="text-sm whitespace-pre-wrap">{coach.notes}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No notes recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
