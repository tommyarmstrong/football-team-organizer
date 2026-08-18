import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditMatchDay } from "@/lib/authz/context";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchGoalEditSection } from "@/components/matches/match-goal-edit-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewMatchGoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period_id?: string }>;
}) {
  const { id: matchId } = await params;
  const { period_id: periodId } = await searchParams;
  const ctx = await getViewerContext();
  const { data: match, error: matchError } = await getMatch(matchId);

  if (matchError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Goal" />
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

  const teamName =
    ctx.visibleTeams.find((t) => t.id === match.team_id)?.name ?? "Our team";

  const [
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
    { data: periods, error: periodsError },
  ] = await Promise.all([
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
    listPeriodsForMatch(match.id),
  ]);

  const matchSquadIds = new Set(matchPlayerRows.map((r) => r.player_id));
  const hasMatchSquad = matchSquadIds.size > 0;
  const eventPlayers = hasMatchSquad
    ? players.filter((p) => matchSquadIds.has(p.id))
    : players;

  const defaultPeriodId =
    periodId && periods.some((period) => period.id === periodId)
      ? periodId
      : null;

  const loadErrors = [playersError, matchPlayersError, periodsError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader title="Add goal" description={`vs ${match.opponent_name}`} />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Goal details</CardTitle>
          <CardDescription>
            Choose the scorer and other details. Use Save to add the goal and
            return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchGoalEditSection
            matchId={match.id}
            players={eventPlayers}
            periods={periods}
            teamName={teamName}
            opponentName={match.opponent_name}
            canEdit
            defaultPeriodId={defaultPeriodId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
