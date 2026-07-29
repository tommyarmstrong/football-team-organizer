import Link from "next/link";
import { listPlayers } from "@/lib/data/players";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import { playerDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PlayerForm } from "@/components/players/player-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PlayersPage() {
  const [ctx, club, { data: players, error }] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    listPlayers(),
  ]);

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Players"
        description={
          club ? `Players across ${club.name}` : "Players you can see"
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {canAdd ? (
        <Card>
          <CardHeader>
            <CardTitle>Add player</CardTitle>
            <CardDescription>
              Players belong to the club and can be assigned to one or more
              teams from a player&apos;s page or a team&apos;s squad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerForm mode="create" />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3" aria-labelledby="players-heading">
        <h2 id="players-heading" className="text-lg font-medium">
          All players
        </h2>
        {!error && players.length === 0 ? (
          <EmptyState
            title="No players yet"
            description={
              canAdd
                ? "Add your first player to the club."
                : "Players in your teams will appear here."
            }
          />
        ) : null}
        {!error && players.length > 0 ? (
          <ul className="divide-border border-border divide-y rounded-xl border">
            {players.map((player) => (
              <li key={player.id}>
                <Link
                  href={`/players/${player.id}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div>
                    <p className="font-medium">{playerDisplayName(player)}</p>
                    <p className="text-muted-foreground text-sm">
                      {player.position ?? "No position"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {player.teams.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        No teams
                      </span>
                    ) : (
                      player.teams.map((team) => (
                        <span
                          key={team.team_player_id}
                          className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                        >
                          {team.team_name}
                          {team.shirt_number != null
                            ? ` #${team.shirt_number}`
                            : ""}
                          {team.active ? "" : " (inactive)"}
                        </span>
                      ))
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
