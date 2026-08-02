import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { matchAllowsEvents } from "@/lib/constants";
import { listCardsForMatch } from "@/lib/data/cards";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatMatchTitle,
  playerDisplayName,
  scoreFromGoals,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchCardsSection } from "@/components/matches/match-cards-section";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import {
  LiveIndicator,
  MatchHeaderMeta,
} from "@/components/matches/match-header-meta";
import { MatchPeriodsSection } from "@/components/matches/match-periods-section";
import { MatchSquadSection } from "@/components/matches/match-squad-section";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const isCancelledOrPostponed =
    match.status === "cancelled" || match.status === "postponed";

  const team = ctx.visibleTeams.find((t) => t.id === match.team_id);
  const teamName = team?.name ?? "Our team";
  const opponentName = match.opponent_name;

  const [
    { data: goals, error: goalsError },
    { data: cards, error: cardsError },
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
    { data: periods, error: periodsError },
  ] = await Promise.all([
    listGoalsForMatch(match.id),
    listCardsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
    listPeriodsForMatch(match.id),
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

  const loadErrors = [playersError, matchPlayersError, periodsError]
    .filter(Boolean)
    .join(" ");

  const { goalsFor, goalsAgainst } = scoreFromGoals(goals);
  const titleText = formatMatchTitle(
    teamName,
    opponentName,
    match.home_away,
    match.status,
    goalsFor,
    goalsAgainst,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          match.status === "in_progress" ? (
            <span className="inline-flex items-center gap-2.5">
              <span>{titleText}</span>
              <LiveIndicator />
            </span>
          ) : (
            titleText
          )
        }
        description={
          <MatchHeaderMeta
            date={match.date}
            kickoffTime={match.kickoff_time}
            venueName={match.venue?.name ?? null}
            status={match.status}
            goalsFor={goalsFor}
            goalsAgainst={goalsAgainst}
            matchDaySquadCount={matchSquadIds.size}
            goals={goals}
            cards={cards}
          />
        }
        actions={
          <>
            {canEdit ? (
              <Link
                href={`/matches/${match.id}/edit`}
                className={buttonVariants({ size: "sm" })}
              >
                Edit
              </Link>
            ) : null}
            <Link
              href="/matches"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back
            </Link>
          </>
        }
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      {allowsEvents ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Players of the match</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground">
                    Coach&apos;s player of the match
                  </dt>
                  <dd className="font-medium">
                    {coachMotm
                      ? playerDisplayName(coachMotm, {
                          shirtNumber: coachMotm.shirt_number,
                        })
                      : "Not selected"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground">
                    Player&apos;s player of the match
                  </dt>
                  <dd className="font-medium">
                    {playersMotm
                      ? playerDisplayName(playersMotm, {
                          shirtNumber: playersMotm.shirt_number,
                        })
                      : "Not selected"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
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
            ? "Edit the match and set status to In progress or Played to record periods, goals, cards, and players of the match."
            : "Periods, goals, cards, and players of the match appear once the match is in progress or played."}
        </p>
      )}

      {!isCancelledOrPostponed ? (
        <Card>
          <CardHeader>
            <CardTitle>Match-day squad</CardTitle>
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
      ) : null}
    </div>
  );
}
