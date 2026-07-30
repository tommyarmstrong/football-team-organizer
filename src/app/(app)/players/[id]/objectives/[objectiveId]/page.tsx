import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, getPlayerTeams } from "@/lib/data/players";
import { getPlayerObjective } from "@/lib/data/player-objectives";
import { canEditPlayer, getViewerContext } from "@/lib/authz/context";
import {
  labelPlayerObjectiveStatus,
  labelPlayerObjectiveType,
  playerDisplayName,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PlayerObjectiveForm } from "@/components/players/player-objective-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PlayerObjectiveEditPage({
  params,
}: {
  params: Promise<{ id: string; objectiveId: string }>;
}) {
  const { id, objectiveId } = await params;
  const ctx = await getViewerContext();
  const [
    { data: player, error: playerError },
    { data: objective, error: objectiveError },
  ] = await Promise.all([getPlayer(id), getPlayerObjective(objectiveId)]);

  if (playerError || objectiveError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Objective" />
        <ErrorBanner
          message={playerError ?? objectiveError ?? "Unknown error"}
        />
      </div>
    );
  }

  if (!player || !objective || !ctx || objective.player_id !== player.id) {
    notFound();
  }

  const { data: teams } = await getPlayerTeams(player.id);
  const canEdit = canEditPlayer(
    ctx,
    player.club_id,
    teams.map((team) => team.team_id),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={objective.body}
        description={`${playerDisplayName(player)} · ${labelPlayerObjectiveType(objective.objective_type)}`}
        actions={
          <Link
            href={`/players/${player.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to player
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {canEdit ? "Edit development objective" : "Development objective"}
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Update the objective text, type, and status."
              : "Details for this player development objective."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <PlayerObjectiveForm
              playerId={player.id}
              objective={objective}
              mode="edit"
            />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-muted-foreground">Objective</dt>
                <dd className="font-medium whitespace-pre-wrap">
                  {objective.body}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {labelPlayerObjectiveType(objective.objective_type)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">
                  {labelPlayerObjectiveStatus(objective.status)}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
