import Link from "next/link";
import { listActivePlayers } from "@/lib/data/players";
import { getCurrentTeam } from "@/lib/data/team";
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
  const team = await getCurrentTeam();
  const { data: players, error } = await listActivePlayers(team?.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Players"
        description={
          team
            ? `Active squad for ${team.name} · ${team.season_label}`
            : "Manage your squad"
        }
      />

      {!team ? <ErrorBanner message="No team found for your account." /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add player</CardTitle>
          <CardDescription>
            New players join the active squad. Deactivate instead of deleting so
            historical goals stay intact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerForm mode="create" />
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="active-squad-heading">
        <h2 id="active-squad-heading" className="text-lg font-medium">
          Active squad
        </h2>
        {!error && players.length === 0 ? (
          <EmptyState
            title="No players yet"
            description="Add your first squad member to start recording goals."
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
                    <p className="font-medium">
                      {playerDisplayName(player, {
                        shirtNumber: player.shirt_number,
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {player.position ?? "No position"}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">View</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
