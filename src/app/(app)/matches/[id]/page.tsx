import Link from "next/link";
import { notFound } from "next/navigation";
import { listCompetitions } from "@/lib/data/competitions";
import { listGoalsForMatch } from "@/lib/data/goals";
import { getMatch } from "@/lib/data/matches";
import { listPlayersForTeam } from "@/lib/data/players";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelMatchStatus,
  labelVenue,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchForm } from "@/components/matches/match-form";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: match, error } = await getMatch(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Match" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!match) {
    notFound();
  }

  const [
    { data: competitions, error: competitionsError },
    { data: goals, error: goalsError },
    { data: players, error: playersError },
  ] = await Promise.all([
    listCompetitions(match.team_id),
    listGoalsForMatch(match.id),
    listPlayersForTeam(match.team_id),
  ]);

  const sectionErrors = [competitionsError, playersError].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`vs ${match.opponent_name}`}
        description={[
          formatMatchDate(match.date),
          formatKickoffTime(match.kickoff_time),
          labelVenue(match.venue),
          labelMatchStatus(match.status),
          match.status === "played"
            ? formatScore(match.goals_for, match.goals_against)
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/matches" />}>
            Back
          </Button>
        }
      />

      {sectionErrors.length > 0 ? (
        <ErrorBanner message={sectionErrors.join(" ")} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Match details</CardTitle>
          <CardDescription>
            Set status to Played and enter the aggregate score. Opposition
            scorers are not recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchForm mode="edit" match={match} competitions={competitions} />
        </CardContent>
      </Card>

      {match.status === "played" ? (
        <Card>
          <CardHeader>
            <CardTitle>Our goals</CardTitle>
            <CardDescription>
              Goals scored by our players only. Optional minute and penalty
              flags supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsError ? <ErrorBanner message={goalsError} /> : null}
            {playersError ? null : (
              <MatchGoalsSection
                matchId={match.id}
                goals={goals}
                players={players}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">
          Mark the match as Played to record our goals.
        </p>
      )}
    </div>
  );
}
