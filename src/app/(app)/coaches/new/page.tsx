import Link from "next/link";
import { getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CoachForm } from "@/components/coaches/coach-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewCoachPage() {
  const [ctx, club] = await Promise.all([getViewerContext(), getPrimaryClub()]);

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  if (!canAdd) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add coach" />
        <EmptyState
          title="Read-only access"
          description="Only coaches and club management can add coaches."
          action={
            <Link
              href="/coaches"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to coaches
            </Link>
          }
        />
      </div>
    );
  }

  const backHref = ctx?.isManagement ? "/club" : "/coaches";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add coach"
        description={
          club
            ? `Record coaching staff for ${club.name}`
            : "Record coaching staff"
        }
        actions={
          <Link
            href={backHref}
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
            Contact details and FA / DBS qualifications. Coaches can be assigned
            to one or more teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
