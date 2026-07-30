import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCoach } from "@/lib/data/coaches";
import { getViewerContext, isClubStaff } from "@/lib/authz/context";
import { coachDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachForm } from "@/components/coaches/coach-form";
import { DeleteCoachButton } from "@/components/coaches/delete-coach-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditCoachPage({
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
        <PageHeader title="Edit coach" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!coach || !ctx) {
    notFound();
  }

  if (!isClubStaff(ctx, coach.club_id)) {
    redirect(`/coaches/${coach.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit coach"
        description={coachDisplayName(coach)}
        actions={
          <Link
            href={`/coaches/${coach.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Coach details</CardTitle>
          <CardDescription>
            Update contact details, biography, philosophy, and qualifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CoachForm mode="edit" coach={coach} />
          <DeleteCoachButton coachId={coach.id} />
        </CardContent>
      </Card>
    </div>
  );
}
