import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getActiveTeam } from "@/lib/data/team";
import { listRosterForTeam } from "@/lib/data/players";
import { getPlayerOfTheMonth } from "@/lib/data/player-of-the-month";
import { formatAwardMonth, playerDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PlayerOfTheMonthForm } from "@/components/team/player-of-the-month-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditPlayerOfTheMonthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const team = await getActiveTeam();
  if (!team) redirect("/team");
  if (!canEditTeam(ctx, team.id)) redirect("/team");

  const [{ data: award, error }, { data: roster }] = await Promise.all([
    getPlayerOfTheMonth(id),
    listRosterForTeam(team.id),
  ]);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit player of the month" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!award) notFound();

  const players = roster.map((p) => ({
    id: p.id,
    person_id: p.person_id,
    first_name: p.first_name,
    last_name: p.last_name,
    shirt_number: p.shirt_number,
  }));

  if (!players.some((p) => p.id === award.player_id)) {
    players.unshift({
      id: award.player.id,
      person_id: award.player.person_id,
      first_name: award.player.first_name,
      last_name: award.player.last_name,
      shirt_number: null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit player of the month"
        description={`${playerDisplayName(award.player)} · ${formatAwardMonth(award.month)}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Award details</CardTitle>
          <CardDescription>Update the player, month, or notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlayerOfTheMonthForm mode="edit" award={award} players={players} />
        </CardContent>
      </Card>
    </div>
  );
}
