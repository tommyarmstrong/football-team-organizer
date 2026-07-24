import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, getPlayerGoals } from "@/lib/data/players";
import {
  formatMatchDate,
  formatShortDate,
  playerDisplayName,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PlayerForm } from "@/components/players/player-form";
import { DeactivatePlayerButton } from "@/components/players/deactivate-player-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: player, error } = await getPlayer(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Player" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!player) {
    notFound();
  }

  const { data: goals, error: goalsError } = await getPlayerGoals(player.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={playerDisplayName(player, {
          shirtNumber: player.shirt_number,
        })}
        description={[
          player.position ?? "No position",
          player.active ? "Active" : "Inactive",
        ].join(" · ")}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/players" />}>
            Back to squad
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit player</CardTitle>
          <CardDescription>
            Set status to inactive to remove from the active squad without
            deleting goal history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlayerForm mode="edit" player={player} />
          {player.active ? (
            <DeactivatePlayerButton playerId={player.id} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals this season</CardTitle>
          <CardDescription>
            {goals.length} goal{goals.length === 1 ? "" : "s"} in played matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goalsError ? <ErrorBanner message={goalsError} /> : null}
          {!goalsError && goals.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Goals scored in played matches will appear here."
            />
          ) : null}
          {!goalsError && goals.length > 0 ? (
            <ul className="divide-border border-border divide-y rounded-xl border">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">vs {goal.opponent_name}</p>
                    <p className="text-muted-foreground">
                      {goal.match_date
                        ? formatMatchDate(goal.match_date)
                        : formatShortDate(goal.created_at.slice(0, 10))}
                      {goal.minute != null ? ` · ${goal.minute}'` : ""}
                      {goal.is_penalty ? " · Pen" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
