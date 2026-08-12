import { notFound } from "next/navigation";
import { getViewerContext, canEditMatchDay } from "@/lib/authz/context";
import { getGoal } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { listPeriodsForMatch } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { goalScorerLabel } from "@/lib/format";
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

export default async function MatchGoalEditPage({
  params,
}: {
  params: Promise<{ id: string; goalId: string }>;
}) {
  const { id: matchId, goalId } = await params;
  const ctx = await getViewerContext();
  const [{ data: match, error: matchError }, { data: goal, error: goalError }] =
    await Promise.all([getMatch(matchId), getGoal(goalId)]);

  if (matchError || goalError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Goal" />
        <ErrorBanner message={matchError ?? goalError ?? "Unknown error"} />
      </div>
    );
  }

  if (!match || !goal || !ctx || goal.match_id !== match.id) {
    notFound();
  }

  const canEdit = canEditMatchDay(ctx, match.team_id);
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
    ? players.filter(
        (p) =>
          matchSquadIds.has(p.id) ||
          p.id === goal.player_id ||
          p.id === goal.assist_player_id,
      )
    : players;

  const loadErrors = [playersError, matchPlayersError, periodsError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`⚽ ${goalScorerLabel(goal)}`}
        description={`vs ${match.opponent_name}`}
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit goal</CardTitle>
          <CardDescription>
            Update the scorer, assist, minute, period, and flags. Use Save to
            save and return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchGoalEditSection
            matchId={match.id}
            goal={goal}
            players={eventPlayers}
            periods={periods}
            teamName={teamName}
            opponentName={match.opponent_name}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
