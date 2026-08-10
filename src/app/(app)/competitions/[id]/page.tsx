import { notFound, redirect } from "next/navigation";
import { getViewerContext, canEditTeam } from "@/lib/authz/context";
import { getCompetition } from "@/lib/data/competitions";
import {
  labelCompetitionGender,
  labelCompetitionKind,
  labelCompetitionPeriods,
  labelCompetitionResult,
} from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { EditIconLink } from "@/components/shared/edit-icon-control";
import { DeleteCompetitionButton } from "@/components/team/delete-competition-button";
import { CompetitionResultChip } from "@/components/team/competition-result-chip";

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

  const canView = ctx.visibleTeams.some(
    (team) => team.id === competition.team_id,
  );
  if (!canView) {
    redirect("/dashboard");
  }

  const canEdit = canEditTeam(ctx, competition.team_id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={competition.name}
        description={
          <div className="space-y-2">
            <p>{labelCompetitionKind(competition.kind)}</p>
            <CompetitionResultChip result={competition.result} />
            <dl className="grid gap-2 sm:grid-cols-2">
              <Detail
                label="Result"
                value={labelCompetitionResult(competition.result)}
              />
              <Detail label="Season" value={competition.season ?? "—"} />
              <Detail
                label="Knock out"
                value={competition.knockout ? "Yes" : "No"}
              />
              <Detail label="Age group" value={competition.age_group ?? "—"} />
              <Detail
                label="Gender"
                value={labelCompetitionGender(competition.gender)}
              />
              <Detail
                label="Players per team"
                value={
                  competition.players_per_team != null
                    ? String(competition.players_per_team)
                    : "—"
                }
              />
              <Detail
                label="Periods"
                value={labelCompetitionPeriods(competition.periods)}
              />
              <Detail
                label="Minutes per period"
                value={
                  competition.minutes_per_period != null
                    ? String(competition.minutes_per_period)
                    : "—"
                }
              />
            </dl>
            {competition.notes ? (
              <p className="whitespace-pre-wrap">{competition.notes}</p>
            ) : null}
          </div>
        }
        actions={
          canEdit ? (
            <>
              <EditIconLink
                href={`/competitions/${competition.id}/edit`}
                label="Edit competition"
              />
              <DeleteCompetitionButton
                competitionId={competition.id}
                competitionName={competition.name}
                label="Delete competition"
              />
            </>
          ) : undefined
        }
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
