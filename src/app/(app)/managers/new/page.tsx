import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext, canManageClub } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ManagerForm } from "@/components/managers/manager-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewManagerPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add manager" />
        <EmptyState
          title="No club found"
          description="Create a club before adding managers."
          action={
            <Link
              href="/club"
              className={buttonVariants({ variant: "outline" })}
            >
              Back to club
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add manager"
        description={`Add club management for ${club.name}`}
        actions={
          <Link
            href="/club"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Manager details</CardTitle>
          <CardDescription>
            Name and contact details for a club manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
