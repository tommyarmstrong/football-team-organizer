import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canEditTeam, getViewerContext } from "@/lib/authz/context";
import { listCompetitions } from "@/lib/data/competitions";
import { listMatchPlayers } from "@/lib/data/match-players";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { listVenues } from "@/lib/data/venues";
import { formatMatchVersusTitle } from "@/lib/format";
import { MatchForm } from "@/components/matches/match-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditMatchPage({
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
        <PageHeader title="Edit match" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!match || !ctx) {
    notFound();
  }

  if (!canEditTeam(ctx, match.team_id)) {
    redirect(`/matches/${match.id}`);
  }

  const team = ctx.visibleTeams.find((t) => t.id === match.team_id);
  const clubId = team?.club_id;
  const teamName = team?.name ?? "Our team";

  const [
    { data: competitions, error: competitionsError },
    { data: players, error: playersError },
    { data: matchPlayerRows, error: matchPlayersError },
    { data: venues, error: venuesError },
  ] = await Promise.all([
    listCompetitions(match.team_id),
    listRosterForTeam(match.team_id, { includeInactive: true }),
    listMatchPlayers(match.id),
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

  const loadErrors = [
    competitionsError,
    playersError,
    matchPlayersError,
    venuesError,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit match"
        description={formatMatchVersusTitle(
          teamName,
          match.opponent_name,
          match.home_away,
        )}
        actions={
          <Link
            href={`/matches/${match.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back
          </Link>
        }
      />

      {loadErrors ? <ErrorBanner message={loadErrors} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Match details</CardTitle>
          <CardDescription>
            Update fixture details and status. Score comes from goals recorded
            on the match page.
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
    </div>
  );
}
