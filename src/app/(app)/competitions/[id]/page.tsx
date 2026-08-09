import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getCompetition } from "@/lib/data/competitions";
import { labelCompetitionKind } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CompetitionForm } from "@/components/team/competition-form";
import { DeleteCompetitionButton } from "@/components/team/delete-competition-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CompetitionDetailPage({
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
        <PageHeader title="Competition" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!competition) {
    notFound();
  }

  if (!canEditTeam(ctx, competition.team_id)) {
    redirect("/team");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={competition.name}
        description={labelCompetitionKind(competition.kind)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit competition</CardTitle>
          <CardDescription>
            Update competition details. Use Save to save and return.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompetitionForm competition={competition} />
          <DeleteCompetitionButton
            competitionId={competition.id}
            competitionName={competition.name}
            label="Delete competition"
          />
        </CardContent>
      </Card>
    </div>
  );
}
