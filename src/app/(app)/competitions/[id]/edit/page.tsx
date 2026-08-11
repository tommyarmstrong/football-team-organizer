import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getCompetition } from "@/lib/data/competitions";
import { listVenues } from "@/lib/data/venues";
import { getCurrentTeam } from "@/lib/data/team";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CompetitionForm } from "@/components/team/competition-form";
import { Card } from "@/components/ui/card";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  if (!ctx) {
    redirect("/login");
  }

  const { data: competition, error } = await getCompetition(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit competition" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!competition) {
    notFound();
  }

  if (!canEditTeam(ctx, competition.team_id)) {
    redirect(`/competitions/${competition.id}`);
  }

  const team = await getCurrentTeam();
  const { data: venues } = await listVenues(team?.club_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit competition" description={competition.name} />

      <Card>
        <CompetitionForm
          competition={competition}
          venues={venues}
          mode="edit"
        />
      </Card>
    </div>
  );
}
