import { listVenues } from "@/lib/data/venues";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { matchAllowsEvents } from "@/lib/constants";
import { listCardsForMatch } from "@/lib/data/cards";
import { listTeamCoaches } from "@/lib/data/coaches";
import { listCompetitions } from "@/lib/data/competitions";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listGuardians } from "@/lib/data/guardians";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelHomeAway,
  labelMatchStatus,
  playerDisplayName,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchCardsSection } from "@/components/matches/match-cards-section";
import { MatchForm } from "@/components/matches/match-form";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { buttonVariants } from "@/components/ui/button";
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
  const allowsEvents = matchAllowsEvents(match.status);

  const clubId = ctx.visibleTeams.find((t) => t.id === match.team_id)?.club_id;

  const [
    { data: competitions, error: competitionsError },
    { data: goals, error: goalsError },
    { data: cards, error: cardsError },
    { data: players, error: playersError },
    { data: coaches, error: coachesError },
    { data: guardians, error: guardiansError },
    { data: venues, error: venuesError },
  ] = await Promise.all([
    listCompetitions(match.team_id),
    listGoalsForMatch(match.id),
    listCardsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listTeamCoaches(match.team_id),
    listGuardians(),
    listVenues(clubId),
  ]);

  const coachMotm = match.player_of_the_match_id
    ? players.find((p) => p.id === match.player_of_the_match_id)
    : null;
  const playersMotm = match.players_player_of_the_match_id
    ? players.find((p) => p.id === match.players_player_of_the_match_id)
    : null;

  const loadErrors = [
    competitionsError,
    playersError,
    coachesError,
    guardiansError,
    venuesError,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`vs ${match.opponent_name}`}
        description={[
          formatMatchDate(match.date),
          formatKickoffTime(match.kickoff_time),
          labelHomeAway(match.home_away),
          match.venue?.name ?? null,
          labelMatchStatus(match.status),
          allowsEvents
            ? formatScore(match.goals_for, match.goals_against)
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Link
            href="/matches"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back
          </Link>
        }
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Match details</CardTitle>
            <CardDescription>
              Set status to In progress or Played to enter the score, goals,
              cards, and players of the match.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchForm
              mode="edit"
              match={match}
              competitions={competitions}
              venues={venues}
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
              <ReadOnly
                label="Home / away"
                value={labelHomeAway(match.home_away)}
              />
              <ReadOnly label="Venue" value={match.venue?.name ?? "Unknown"} />
              <ReadOnly label="Status" value={labelMatchStatus(match.status)} />
              {allowsEvents ? (
                <ReadOnly
                  label="Score"
                  value={formatScore(match.goals_for, match.goals_against)}
                />
              ) : null}
              {match.notes ? (
                <ReadOnly label="Coach's notes" value={match.notes} />
              ) : null}
              {match.club_notes ? (
                <ReadOnly label="Club notes" value={match.club_notes} />
              ) : null}
            </dl>
          </CardContent>
        </Card>
      )}

      {allowsEvents ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Coach&apos;s player of the match</CardTitle>
            </CardHeader>
            <CardContent>
              {coachMotm ? (
                <p className="font-medium">
                  {playerDisplayName(coachMotm, {
                    shirtNumber: coachMotm.shirt_number,
                  })}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Not selected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player&apos;s player of the match</CardTitle>
            </CardHeader>
            <CardContent>
              {playersMotm ? (
                <p className="font-medium">
                  {playerDisplayName(playersMotm, {
                    shirtNumber: playersMotm.shirt_number,
                  })}
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

          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>
                Yellow cards, red cards, timeouts, and other cards for a player,
                coach, or guardian.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cardsError ? <ErrorBanner message={cardsError} /> : null}
              <MatchCardsSection
                matchId={match.id}
                cards={cards}
                players={players}
                coaches={coaches}
                guardians={guardians}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          {canEdit
            ? "Set the match to In progress or Played to record goals, cards, and players of the match."
            : "Goals, cards, and players of the match appear once the match is in progress or played."}
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
