import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoach } from "@/lib/data/coaches";
import { getViewerContext, isClubStaff } from "@/lib/authz/context";
import { coachDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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

export default async function NewCoachObjectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: coach, error } = await getCoach(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="New objective" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!coach || !ctx) {
    notFound();
  }

  const canEdit = isClubStaff(ctx, coach.club_id);

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="New objective" />
        <EmptyState
          title="Read-only access"
          description="Only club staff can add development objectives."
          action={
            <Link
              href={`/coaches/${coach.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to coach
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
        description={`Development objective for ${coachDisplayName(coach)}`}
        actions={
          <Link
            href={`/coaches/${coach.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to coach
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Add development objective</CardTitle>
          <CardDescription>
            Set the objective text, type, status, and optional target date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachObjectiveForm coachId={coach.id} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
