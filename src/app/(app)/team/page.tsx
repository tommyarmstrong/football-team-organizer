import { getCurrentTeam } from "@/lib/data/team";
import { listCompetitions } from "@/lib/data/competitions";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { TeamProfileForm } from "@/components/team/team-profile-form";
import { CompetitionsSection } from "@/components/team/competitions-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamPage() {
  const team = await getCurrentTeam();
  const { data: competitions, error: competitionsError } =
    await listCompetitions(team?.id);

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="Team" />
        <ErrorBanner message="No team found for your account." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        description={`${team.club} · ${team.name} · ${team.season_label}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Club details for this season. Squad is managed under Players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamProfileForm team={team} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitions</CardTitle>
          <CardDescription>
            Leagues, cups, and other competitions for {team.season_label}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitionsError ? (
            <ErrorBanner message={competitionsError} />
          ) : (
            <CompetitionsSection competitions={competitions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
