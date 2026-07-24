import Link from "next/link";
import { listCompetitions } from "@/lib/data/competitions";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
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
  const { data: competitions, error } = await listCompetitions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New fixture"
        description="Schedule a match for your team"
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
            Score and goals are entered later when the match is played.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchForm mode="create" competitions={competitions} />
        </CardContent>
      </Card>
    </div>
  );
}
