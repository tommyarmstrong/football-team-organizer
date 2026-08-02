import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/data/people";
import { getCoachObjective } from "@/lib/data/coach-objectives";
import { getViewerContext, isClubStaff } from "@/lib/authz/context";
import {
  formatShortDate,
  labelCoachObjectiveStatus,
  labelCoachObjectiveType,
} from "@/lib/format";
import { personDisplayName } from "@/lib/people/person";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachObjectiveForm } from "@/components/coaches/coach-objective-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoachObjectiveEditPage({
  params,
}: {
  params: Promise<{ id: string; objectiveId: string }>;
}) {
  const { id, objectiveId } = await params;
  const ctx = await getViewerContext();
  const [
    { data: person, error: personError },
    { data: objective, error: objectiveError },
  ] = await Promise.all([getPerson(id), getCoachObjective(objectiveId)]);

  if (personError || objectiveError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Objective" />
        <ErrorBanner
          message={personError ?? objectiveError ?? "Unknown error"}
        />
      </div>
    );
  }

  const coach = person?.coaches.find((c) => c.active_role) ?? null;

  if (
    !person ||
    !coach ||
    !objective ||
    !ctx ||
    objective.coach_id !== coach.id
  ) {
    notFound();
  }

  const canEdit = isClubStaff(ctx, coach.club_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={objective.body}
        description={`${personDisplayName(person)} · ${labelCoachObjectiveType(objective.objective_type)}`}
        actions={
          <Link
            href={`/people/${person.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to person
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
              ? "Update the objective text, type, status, and target date."
              : "Details for this coach development objective."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <CoachObjectiveForm
              coachId={coach.id}
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
                  {labelCoachObjectiveType(objective.objective_type)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium">
                  {labelCoachObjectiveStatus(objective.status)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Target date</dt>
                <dd className="font-medium">
                  {objective.target_date
                    ? formatShortDate(objective.target_date)
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
