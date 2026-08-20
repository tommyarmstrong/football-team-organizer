import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditMatchDay } from "@/lib/authz/context";
import {
  availableExtraTimeOrPenaltyPeriodNames,
  matchAllowsEvents,
} from "@/lib/constants";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchPeriodCreateSection } from "@/components/matches/match-period-create-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewMatchPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const ctx = await getViewerContext();
  const { data: match, error: matchError } = await getMatch(matchId);

  if (matchError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Add extra time or penalties" />
        <ErrorBanner message={matchError} />
      </div>
    );
  }

  if (!match || !ctx) {
    notFound();
  }

  if (!canEditMatchDay(ctx, match.team_id)) {
    redirect(`/matches/${match.id}`);
  }

  if (!matchAllowsEvents(match.status)) {
    redirect(`/matches/${match.id}`);
  }

  const [
    { data: goals, error: goalsError },
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
    { data: periods, error: periodsError },
  ] = await Promise.all([
    listGoalsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
    listPeriodsForMatch(match.id),
  ]);

  const matchSquadIds = new Set(matchPlayerRows.map((r) => r.player_id));
  const hasMatchSquad = matchSquadIds.size > 0;
  const eventPlayers = hasMatchSquad
    ? players.filter((p) => matchSquadIds.has(p.id))
    : players;
  const defaultStarterPlayerIds = hasMatchSquad
    ? [...matchSquadIds]
    : eventPlayers.map((player) => player.id);
  const availablePeriodNames = availableExtraTimeOrPenaltyPeriodNames(
    periods.map((period) => period.name),
  );

  const loadErrors = [goalsError, playersError, matchPlayersError, periodsError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add extra time or penalties"
        description={`vs ${match.opponent_name}`}
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Period details</CardTitle>
          <CardDescription>
            Choose extra time or a penalty shootout and set starting players.
            Goals already recorded on the match are listed below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchPeriodCreateSection
            matchId={match.id}
            availablePeriodNames={availablePeriodNames}
            goals={goals}
            squadPlayers={eventPlayers}
            defaultStarterPlayerIds={defaultStarterPlayerIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
