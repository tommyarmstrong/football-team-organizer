import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getActiveTeam } from "@/lib/data/team";
import { listCoaches, listTeamCoaches } from "@/lib/data/coaches";
import { listVenues } from "@/lib/data/venues";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamProfileForm } from "@/components/team/team-profile-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditTeamPage() {
  const ctx = await getViewerContext();
  if (!ctx) {
    redirect("/login");
  }

  const team = await getActiveTeam();
  if (!team) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit team" />
        <EmptyState
          title="No team selected"
          description="Select or create a team before editing its profile."
          action={
            <Link
              href="/team"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to team
            </Link>
          }
        />
      </div>
    );
  }

  if (!canEditTeam(ctx, team.id)) {
    redirect("/team");
  }

  const [{ data: clubCoaches }, { data: teamCoaches }, { data: clubVenues }] =
    await Promise.all([
      listCoaches(),
      listTeamCoaches(team.id),
      listVenues(team.club_id),
    ]);

  const coaches = clubCoaches.filter((c) => c.club_id === team.club_id);
  const headCoach = teamCoaches.find((c) => c.role === "Head Coach") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit team" description={team.name} />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update team details for this season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamProfileForm
            key={team.id}
            team={team}
            coaches={coaches}
            venues={clubVenues}
            headCoachId={headCoach?.coach_id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
