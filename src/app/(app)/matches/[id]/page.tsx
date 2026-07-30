import { listVenues } from "@/lib/data/venues";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { matchAllowsEvents } from "@/lib/constants";
import { listCardsForMatch } from "@/lib/data/cards";
import { listCompetitions } from "@/lib/data/competitions";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatKickoffTime,
  formatMatchDate,
  formatMatchVersusTitle,
  formatScore,
  labelHomeAway,
  labelMatchStatus,
  playerDisplayName,
  scoreFromGoals,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchCardsSection } from "@/components/matches/match-cards-section";
import { MatchForm } from "@/components/matches/match-form";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { MatchPeriodsSection } from "@/components/matches/match-periods-section";
import { MatchSquadSection } from "@/components/matches/match-squad-section";
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

  const team = ctx.visibleTeams.find((t) => t.id === match.team_id);
  const clubId = team?.club_id;
  const teamName = team?.name ?? "Our team";
  const opponentName = match.opponent_name;

  const [
    { data: competitions, error: competitionsError },
    { data: goals, error: goalsError },
    { data: cards, error: cardsError },
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
    { data: periods, error: periodsError },
    { data: venues, error: venuesError },
  ] = await Promise.all([
    listCompetitions(match.team_id),
    listGoalsForMatch(match.id),
    listCardsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
    listPeriodsForMatch(match.id),
    listVenues(clubId),
  ]);

  const matchSquadIds = new Set(matchPlayerRows.map((r) => r.player_id));
  const hasMatchSquad = matchSquadIds.size > 0;
  const eventPlayers = hasMatchSquad
    ? players.filter(
        (p) =>
          matchSquadIds.has(p.id) ||
          p.id === match.player_of_the_match_id ||
          p.id === match.players_player_of_the_match_id,
      )
    : players;

  const coachMotm = match.player_of_the_match_id
    ? players.find((p) => p.id === match.player_of_the_match_id)
    : null;
  const playersMotm = match.players_player_of_the_match_id
    ? players.find((p) => p.id === match.players_player_of_the_match_id)
    : null;

  const loadErrors = [
    competitionsError,
    playersError,
    matchPlayersError,
    periodsError,
    venuesError,
  ]
    .filter(Boolean)
    .join(" ");

  const { goalsFor, goalsAgainst } = scoreFromGoals(goals);
  const scoreLabel = allowsEvents ? formatScore(goalsFor, goalsAgainst) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={formatMatchVersusTitle(teamName, opponentName, match.home_away)}
        description={[
          formatMatchDate(match.date),
          formatKickoffTime(match.kickoff_time),
          labelHomeAway(match.home_away),
          match.venue?.name ?? null,
          labelMatchStatus(match.status),
          scoreLabel,
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
              Set status to In progress or Played to record goals, cards, and
              players of the match. Score comes from goals recorded below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchForm
              mode="edit"
              match={match}
              competitions={competitions}
              venues={venues}
              players={eventPlayers}
              matchDaySquadCount={matchSquadIds.size}
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
              <ReadOnly
                label="Match-day squad"
                value={String(matchSquadIds.size)}
              />
              <ReadOnly label="Status" value={labelMatchStatus(match.status)} />
              {scoreLabel ? (
                <ReadOnly label="Score" value={scoreLabel} />
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

      <Card>
        <CardHeader>
          <CardTitle>Match-day squad</CardTitle>
          <CardDescription>
            Players available for this match. Not every squad player plays every
            game.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchSquadSection
            matchId={match.id}
            roster={players}
            selectedPlayerIds={[...matchSquadIds]}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

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
              <CardTitle>Periods</CardTitle>
              <CardDescription>
                Quarters, halves, and other periods. Open a period to set
                starting players and goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {periodsError ? <ErrorBanner message={periodsError} /> : null}
              <MatchPeriodsSection
                matchId={match.id}
                periods={periods}
                goals={goals}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>
                Goals scored by our team or the opposition. Open a goal to set
                assist, minute, period, and flags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalsError ? <ErrorBanner message={goalsError} /> : null}
              <MatchGoalsSection
                matchId={match.id}
                goals={goals}
                players={eventPlayers}
                teamName={teamName}
                opponentName={opponentName}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>
                Yellow cards, red cards, timeouts, and other cards for a player.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cardsError ? <ErrorBanner message={cardsError} /> : null}
              <MatchCardsSection
                matchId={match.id}
                cards={cards}
                players={eventPlayers}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          {canEdit
            ? "Set the match to In progress or Played to record periods, goals, cards, and players of the match."
            : "Periods, goals, cards, and players of the match appear once the match is in progress or played."}
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
