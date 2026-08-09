import { redirect } from "next/navigation";
import { getViewerContext, canManageClub } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listCoaches } from "@/lib/data/coaches";
import { listVenues } from "@/lib/data/venues";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CreateTeamForm } from "@/components/team/create-team-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewTeamPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add team" />
        <EmptyState
          title="No club found"
          description="Create a club before adding teams."
        />
      </div>
    );
  }

  const [{ data: allCoaches, error }, { data: allVenues }] = await Promise.all([
    listCoaches(),
    listVenues(club.id),
  ]);
  const coaches = allCoaches.filter((c) => c.club_id === club.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add team"
        description={`Create a team for ${club.name}`}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Team details</CardTitle>
          <CardDescription>
            Age group, venues, and optional head coach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm coaches={coaches} venues={allVenues} />
        </CardContent>
      </Card>
    </div>
  );
}
