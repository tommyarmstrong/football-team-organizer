import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { listGoalsForMatch } from "@/lib/data/goals";
import { listMatchPlayers } from "@/lib/data/match-players";
import { getPeriod } from "@/lib/data/match-periods";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchPeriodEditSection } from "@/components/matches/match-period-edit-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MatchPeriodEditPage({
  params,
}: {
  params: Promise<{ id: string; periodId: string }>;
}) {
  const { id: matchId, periodId } = await params;
  const ctx = await getViewerContext();
  const [
    { data: match, error: matchError },
    { data: period, error: periodError },
  ] = await Promise.all([getMatch(matchId), getPeriod(periodId)]);

  if (matchError || periodError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Period" />
        <ErrorBanner message={matchError ?? periodError ?? "Unknown error"} />
      </div>
    );
  }

  if (!match || !period || !ctx || period.match_id !== match.id) {
    notFound();
  }

  const canEdit = canEditTeam(ctx, match.team_id);
  const teamName =
    ctx.visibleTeams.find((t) => t.id === match.team_id)?.name ?? "Our team";

  const [
    { data: goals, error: goalsError },
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
  ] = await Promise.all([
    listGoalsForMatch(match.id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
  ]);

  const matchSquadIds = new Set(matchPlayerRows.map((r) => r.player_id));
  const hasMatchSquad = matchSquadIds.size > 0;
  const eventPlayers = hasMatchSquad
    ? players.filter((p) => matchSquadIds.has(p.id))
    : players;

  const periodGoals = goals.filter((g) => g.period_id === period.id);
  const loadErrors = [goalsError, playersError, matchPlayersError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={period.name}
        description={`vs ${match.opponent_name}`}
        actions={
          canEdit ? null : (
            <Link
              href={`/matches/${match.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to match
            </Link>
          )
        }
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit period</CardTitle>
          <CardDescription>
            Set the period type, starting players, and goals. Use Back to match
            to save and return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchPeriodEditSection
            matchId={match.id}
            period={period}
            goals={periodGoals}
            squadPlayers={eventPlayers}
            teamName={teamName}
            opponentName={match.opponent_name}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
