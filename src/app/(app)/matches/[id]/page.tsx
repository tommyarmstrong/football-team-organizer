import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { listCompetitions } from "@/lib/data/competitions";
import { listGoalsForMatch } from "@/lib/data/goals";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelMatchStatus,
  labelVenue,
  playerDisplayName,
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
  const ctx = await getViewerContext();
  const { data: match, error } = await getMatch(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Match" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!match || !ctx) {
    notFound();
  }

  const canEdit = canEditTeam(ctx, match.team_id);

  const [
    { data: competitions, error: competitionsError },
    { data: goals, error: goalsError },
    { data: players, error: playersError },
  ] = await Promise.all([
    listCompetitions(match.team_id),
    listGoalsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
  ]);

  const motm = match.player_of_the_match_id
    ? players.find((p) => p.id === match.player_of_the_match_id)
    : null;

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

      {competitionsError || playersError ? (
        <ErrorBanner
          message={[competitionsError, playersError].filter(Boolean).join(" ")}
        />
      ) : null}

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Match details</CardTitle>
            <CardDescription>
              Set status to Played, enter the aggregate score, and pick the
              player of the match.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchForm
              mode="edit"
              match={match}
              competitions={competitions}
              players={players}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Match details</CardTitle>
            <CardDescription>Read-only</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ReadOnly label="Opponent" value={match.opponent_name} />
              <ReadOnly label="Date" value={formatMatchDate(match.date)} />
              <ReadOnly label="Venue" value={labelVenue(match.venue)} />
              <ReadOnly label="Status" value={labelMatchStatus(match.status)} />
              {match.status === "played" ? (
                <ReadOnly
                  label="Score"
                  value={formatScore(match.goals_for, match.goals_against)}
                />
              ) : null}
              {match.notes ? (
                <ReadOnly label="Notes" value={match.notes} />
              ) : null}
            </dl>
          </CardContent>
        </Card>
      )}

      {match.status === "played" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Player of the match</CardTitle>
            </CardHeader>
            <CardContent>
              {motm ? (
                <p className="font-medium">
                  {playerDisplayName(motm, { shirtNumber: motm.shirt_number })}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Not selected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our goals</CardTitle>
              <CardDescription>
                Goals scored by our players only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalsError ? <ErrorBanner message={goalsError} /> : null}
              <MatchGoalsSection
                matchId={match.id}
                goals={goals}
                players={players}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          {canEdit
            ? "Mark the match as Played to record our goals and player of the match."
            : "Goals and player of the match appear once the match is played."}
        </p>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
