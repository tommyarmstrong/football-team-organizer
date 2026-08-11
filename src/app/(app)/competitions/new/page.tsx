import { redirect } from "next/navigation";
import { canEditActiveTeam, getCurrentTeam } from "@/lib/data/team";
import { listVenues } from "@/lib/data/venues";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CompetitionForm } from "@/components/team/competition-form";
import { Card } from "@/components/ui/card";

export default async function NewCompetitionPage() {
  const [team, canEdit] = await Promise.all([
    getCurrentTeam(),
    canEditActiveTeam(),
  ]);

  if (!team) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add competition" />
        <EmptyState
          title="No team selected"
          description="Select a team before adding a competition."
        />
      </div>
    );
  }

  if (!canEdit) {
    redirect("/dashboard");
  }

  const { data: venues } = await listVenues(team.club_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add competition"
        description={`New competition for ${team.season_label}`}
      />

      <Card>
        <CompetitionForm competition={null} venues={venues} mode="create" />
      </Card>
    </div>
  );
}
