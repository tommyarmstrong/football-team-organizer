import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getCard } from "@/lib/data/cards";
import { listMatchPlayers } from "@/lib/data/match-players";
import { getMatch } from "@/lib/data/matches";
import { listRosterForTeam } from "@/lib/data/players";
import { CARD_TYPE_EMOJIS, CARD_TYPE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { MatchCardEditSection } from "@/components/matches/match-card-edit-section";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MatchCardEditPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const { id: matchId, cardId } = await params;
  const ctx = await getViewerContext();
  const [{ data: match, error: matchError }, { data: card, error: cardError }] =
    await Promise.all([getMatch(matchId), getCard(cardId)]);

  if (matchError || cardError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Card" />
        <ErrorBanner message={matchError ?? cardError ?? "Unknown error"} />
      </div>
    );
  }

  if (!match || !card || !ctx || card.match_id !== match.id) {
    notFound();
  }

  const canEdit = canEditTeam(ctx, match.team_id);

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
    ? players.filter((p) => matchSquadIds.has(p.id) || p.id === card.player_id)
    : players;

  const loadErrors = [playersError, matchPlayersError]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${CARD_TYPE_EMOJIS[card.type]} ${CARD_TYPE_LABELS[card.type]}`}
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
          <CardTitle>Edit card</CardTitle>
          <CardDescription>
            Update the player, card type, and notes. Use Back to match to save
            and return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchCardEditSection
            matchId={match.id}
            card={card}
            players={eventPlayers}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
