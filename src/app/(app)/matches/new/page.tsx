import Link from "next/link";
import { listCompetitions } from "@/lib/data/competitions";
import { canEditActiveTeam, getActiveTeam } from "@/lib/data/team";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { MatchForm } from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewMatchPage() {
  const [team, canEdit] = await Promise.all([
    getActiveTeam(),
    canEditActiveTeam(),
  ]);

  if (!team) {
    return (
      <div className="space-y-4">
        <PageHeader title="New fixture" />
        <ErrorBanner message="No team selected." />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="New fixture" />
        <EmptyState
          title="Read-only access"
          description="Only coaches and club management can add fixtures for this team."
          action={
            <Button variant="outline" render={<Link href="/matches" />}>
              Back to matches
            </Button>
          }
        />
      </div>
    );
  }

  const { data: competitions, error } = await listCompetitions(team.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New fixture"
        description={`Schedule a match for ${team.name}`}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/matches" />}>
            Back
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Fixture details</CardTitle>
          <CardDescription>
            Score, goals, and player of the match are entered later when the
            match is played.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchForm mode="create" competitions={competitions} />
        </CardContent>
      </Card>
    </div>
  );
}
