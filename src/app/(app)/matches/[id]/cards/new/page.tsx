import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditMatchDay } from "@/lib/authz/context";
import { listMatchPlayers } from "@/lib/data/match-players";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchCardEditSection } from "@/components/matches/match-card-edit-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewMatchCardPage({
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
        <PageHeader title="Card" />
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

  const [
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
  ] = await Promise.all([
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
  ]);

  const matchSquadIds = new Set(matchPlayerRows.map((r) => r.player_id));
  const hasMatchSquad = matchSquadIds.size > 0;
  const eventPlayers = hasMatchSquad
    ? players.filter((p) => matchSquadIds.has(p.id))
    : players;

  const loadErrors = [playersError, matchPlayersError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader title="Add card" description={`vs ${match.opponent_name}`} />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Card details</CardTitle>
          <CardDescription>
            Choose the player and card type. Use Save to add the card and
            return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchCardEditSection
            matchId={match.id}
            players={eventPlayers}
            canEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
