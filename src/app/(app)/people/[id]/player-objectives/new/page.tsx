import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/data/people";
import { getPlayerTeams } from "@/lib/data/players";
import { canEditPlayer, getViewerContext } from "@/lib/authz/context";
import { personDisplayName } from "@/lib/people/person";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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

export default async function NewPlayerObjectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: person, error } = await getPerson(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="New objective" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  const player = person?.players.find((p) => p.active_role) ?? null;

  if (!person || !player || !ctx) {
    notFound();
  }

  const { data: teams } = await getPlayerTeams(player.id);
  const canEdit = canEditPlayer(
    ctx,
    player.club_id,
    teams.map((team) => team.team_id),
  );

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="New objective" />
        <EmptyState
          title="Read-only access"
          description="Only coaches and club management can add player development objectives."
          action={
            <Link
              href={`/people/${person.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to person
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New objective"
        description={`Development objective for ${personDisplayName(person)}`}
        actions={
          <Link
            href={`/people/${person.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to person
          </Link>
        }
      />

      <p className="text-muted-foreground text-sm">
        For younger children it is usually recommended that objectives are
        limited to no more than one or two items, which they can focus on,
        rather than being overwhelmed by information.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Add development objective</CardTitle>
          <CardDescription>
            Set the objective text, type, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerObjectiveForm playerId={player.id} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
