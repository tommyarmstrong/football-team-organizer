import { notFound } from "next/navigation";
import {
  getViewerContext,
  canEditMatchDay,
  canEditTeamHistory,
} from "@/lib/authz/context";
import { matchAllowsEvents } from "@/lib/constants";
import { listCardsForMatch } from "@/lib/data/cards";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatMatchTitle,
  scoreFromGoals,
  teamDisplayName,
} from "@/lib/format";
import { MatchScoreboard } from "@/components/matches/match-scoreboard";
import { deleteMatchAction } from "@/lib/matches/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import { MatchCardsSection } from "@/components/matches/match-cards-section";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import {
  LiveIndicator,
  MatchHeaderMeta,
} from "@/components/matches/match-header-meta";
import { MatchPeriodsSection } from "@/components/matches/match-periods-section";
import { MatchPlayersOfTheMatchSection } from "@/components/matches/match-players-of-the-match-section";
import { MatchSquadSection } from "@/components/matches/match-squad-section";
import { MatchStatusActions } from "@/components/matches/match-status-actions";

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

  const canEdit = canEditMatchDay(ctx, match.team_id);
  const canEditPlayerOfTheMatch = canEditTeamHistory(ctx, match.team_id);
  const allowsEvents = matchAllowsEvents(match.status);
  const isCancelledOrPostponed =
    match.status === "cancelled" || match.status === "postponed";

  const team = ctx.visibleTeams.find((t) => t.id === match.team_id);
  const teamName = team ? teamDisplayName(team) : "Our team";
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
          <span className="block space-y-3">
            <span className="sr-only">{titleText}</span>
            <MatchScoreboard
              teamName={teamName}
              opponentName={opponentName}
              homeAway={match.home_away}
              status={match.status}
              goalsFor={goalsFor}
              goalsAgainst={goalsAgainst}
            />
            {match.status === "in_progress" ? (
              <span className="flex justify-center">
                <LiveIndicator />
              </span>
            ) : null}
          </span>
        }
        description={
          <MatchHeaderMeta
            date={match.date}
            kickoffTime={match.kickoff_time}
            venueName={match.venue?.name ?? null}
            venueId={match.venue?.id ?? null}
            competitionName={
              match.is_friendly ? "Friendly" : (match.competition?.name ?? null)
            }
            status={match.status}
            matchDaySquadCount={matchSquadIds.size}
            cards={cards}
          />
        }
        actions={
          canEdit ? (
            <>
              <EditIconLink
                href={`/matches/${match.id}/edit`}
                label="Edit match"
              />
              <ListDeleteButton
                label={`Delete match vs ${opponentName}`}
                confirmMessage={`Delete the match against ${opponentName}? This cannot be undone.`}
                deleteAction={deleteMatchAction.bind(null, match.id)}
              />
            </>
          ) : undefined
        }
      />

      {canEdit ? (
        <MatchStatusActions matchId={match.id} status={match.status} />
      ) : null}

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      {allowsEvents ? (
        <>
          <Section title="Goals">
            {goalsError ? <ErrorBanner message={goalsError} /> : null}
            <MatchGoalsSection
              matchId={match.id}
              goals={goals}
              canEdit={canEdit}
            />
          </Section>

          <Section title="Periods">
            {periodsError ? <ErrorBanner message={periodsError} /> : null}
            <MatchPeriodsSection
              matchId={match.id}
              periods={periods}
              goals={goals}
              canEdit={canEdit}
            />
          </Section>
        </>
      ) : null}

      {!isCancelledOrPostponed ? (
        <Section title="Match-day squad">
          <MatchSquadSection
            matchId={match.id}
            roster={players}
            selectedPlayerIds={[...matchSquadIds]}
            canEdit={canEdit}
          />
        </Section>
      ) : null}

      {allowsEvents ? (
        <>
          <Section title="Players of the match">
            <MatchPlayersOfTheMatchSection
              matchId={match.id}
              players={eventPlayers}
              coachPlayerOfTheMatchId={match.player_of_the_match_id}
              playersPlayerOfTheMatchId={match.players_player_of_the_match_id}
              canEdit={canEditPlayerOfTheMatch}
            />
          </Section>

          <Section title="Cards">
            {cardsError ? <ErrorBanner message={cardsError} /> : null}
            <MatchCardsSection
              matchId={match.id}
              cards={cards}
              canEdit={canEdit}
            />
          </Section>
        </>
      ) : null}
    </div>
  );
}
