import { redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getActiveTeam } from "@/lib/data/team";
import { listRosterForTeam } from "@/lib/data/players";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlayerOfTheMonthForm } from "@/components/team/player-of-the-month-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPlayerOfTheMonthPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const team = await getActiveTeam();
  if (!team) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add player of the month" />
        <EmptyState
          title="No team selected"
          description="Select a team before adding awards."
        />
      </div>
    );
  }

  if (!canEditTeam(ctx, team.id)) redirect("/team");

  const { data: roster } = await listRosterForTeam(team.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Add player of the month" description={team.name} />

      <Card>
        <CardHeader>
          <CardTitle>Award details</CardTitle>
          <CardDescription>
            Choose a player and the month they are recognised for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerOfTheMonthForm
            mode="create"
            players={roster.map((p) => ({
              id: p.id,
              person_id: p.person_id,
              first_name: p.first_name,
              last_name: p.last_name,
              shirt_number: p.shirt_number,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
