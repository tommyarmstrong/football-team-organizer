import { notFound } from "next/navigation";
import {
  getViewerContext,
  canEditMatchDay,
  canEditTeamHistory,
} from "@/lib/authz/context";
import {
  availableExtraTimeOrPenaltyPeriodNames,
  matchAllowsEvents,
  matchAllowsPostcard,
} from "@/lib/constants";
import { getMatchDetail } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import {
  formatMatchTitle,
  matchCompetitionLabel,
  scoreFromGoals,
  teamDisplayName,
} from "@/lib/format";
import { MatchHero } from "@/components/matches/match-hero";
import { deleteMatchAction } from "@/lib/matches/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import { MatchCardsSection } from "@/components/matches/match-cards-section";
import { MatchGoalsSection } from "@/components/matches/match-goals-section";
import { MatchPlayersOfTheMatchSection } from "@/components/matches/match-players-of-the-match-section";
import { MatchSquadSection } from "@/components/matches/match-squad-section";
import { MatchStatusActions } from "@/components/matches/match-status-actions";
import { SharePostcardButton } from "@/components/postcards/share-postcard-button";
import { buildMatchPostcardPayload } from "@/lib/postcards/match-postcard";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ctx, detailResult] = await Promise.all([
    getViewerContext(),
    getMatchDetail(id),
  ]);
  const { data: detail, error } = detailResult;

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Match" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!detail || !ctx) {
    notFound();
  }

  const {
    match,
    goals,
    cards,
    matchPlayers: matchPlayerRows,
    periods,
  } = detail;

  const canEdit = canEditMatchDay(ctx, match.team_id);
  const canEditPlayerOfTheMatch = canEditTeamHistory(ctx, match.team_id);
  const allowsEvents = matchAllowsEvents(match.status);
  const isCancelledOrPostponed =
    match.status === "cancelled" || match.status === "postponed";

  const team = ctx.visibleTeams.find((t) => t.id === match.team_id);
  const teamName = team ? teamDisplayName(team) : "Our team";
  const opponentName = match.opponent_name;

  const [{ data: players, error: playersError }, postcardResult] =
    await Promise.all([
      listRosterForTeam(match.team_id, { includeInactive: true }),
      matchAllowsPostcard(match.status)
        ? buildMatchPostcardPayload(match.id)
        : Promise.resolve({ data: null, error: null }),
    ]);
  const postcard = postcardResult.data;

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
  const defaultStarterPlayerIds = hasMatchSquad
    ? [...matchSquadIds]
    : eventPlayers.map((player) => player.id);
  const availablePeriodNames = availableExtraTimeOrPenaltyPeriodNames(
    periods.map((period) => period.name),
  );

  const loadErrors = [playersError, postcardResult.error]
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
    <div className="space-y-6">
      <h1 className="sr-only">{titleText}</h1>
      <div className="space-y-4">
        <MatchHero
          size="hero"
          teamName={teamName}
          opponentName={opponentName}
          homeAway={match.home_away}
          status={match.status}
          goalsFor={goalsFor}
          goalsAgainst={goalsAgainst}
          competitionName={matchCompetitionLabel(match)}
          date={match.date}
          kickoffTime={match.kickoff_time}
          meetupTime={match.meetup_time}
          venueName={match.venue?.name ?? null}
          venueId={match.venue?.id ?? null}
          matchDaySquadCount={matchSquadIds.size}
          cards={cards}
          actions={
            postcard || canEdit ? (
              <>
                {postcard ? (
                  <SharePostcardButton
                    imageUrl={`/matches/${match.id}/postcard`}
                    caption={postcard.caption}
                    fileName={postcard.fileName}
                    title={
                      postcard.kind === "scheduled"
                        ? "Fixture postcard"
                        : "Match postcard"
                    }
                    description={
                      postcard.kind === "scheduled"
                        ? "Share this upcoming fixture, including the venue address."
                        : "Share a recap of this result. Player names follow the team’s privacy rules."
                    }
                    previewAlt={
                      postcard.kind === "scheduled"
                        ? "Fixture postcard"
                        : "Match postcard"
                    }
                  />
                ) : null}
                {canEdit ? (
                  <>
                    <EditIconLink
                      href={`/matches/${match.id}/edit`}
                      label="Edit match"
                      className="size-11 sm:size-9"
                    />
                    <ListDeleteButton
                      label={`Delete match vs ${opponentName}`}
                      confirmMessage={`Delete the match against ${opponentName}? This cannot be undone.`}
                      deleteAction={deleteMatchAction.bind(null, match.id)}
                    />
                  </>
                ) : null}
              </>
            ) : undefined
          }
        />

        {canEdit ? (
          <MatchStatusActions matchId={match.id} status={match.status} />
        ) : null}
      </div>

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      {allowsEvents ? (
        <Section title="Goals">
          <MatchGoalsSection
            matchId={match.id}
            goals={goals}
            periods={periods}
            canEdit={canEdit}
            showAddPeriod={canEdit}
            homeAway={match.home_away}
            addGoal={
              canEdit
                ? {
                    players: eventPlayers,
                    teamName,
                    opponentName,
                  }
                : null
            }
            addPeriod={
              canEdit
                ? {
                    availablePeriodNames,
                    squadPlayers: eventPlayers,
                    defaultStarterPlayerIds,
                  }
                : null
            }
          />
        </Section>
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
          <MatchPlayersOfTheMatchSection
            matchId={match.id}
            players={eventPlayers}
            coachPlayerOfTheMatchId={match.player_of_the_match_id}
            playersPlayerOfTheMatchId={match.players_player_of_the_match_id}
            canEdit={canEditPlayerOfTheMatch}
          />

          <Section title="Cards">
            <MatchCardsSection
              matchId={match.id}
              cards={cards}
              players={eventPlayers}
              canEdit={canEdit}
            />
          </Section>
        </>
      ) : null}
    </div>
  );
}
