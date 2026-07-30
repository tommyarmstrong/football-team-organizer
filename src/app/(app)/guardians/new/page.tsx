import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext, canManageClub } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GuardianForm } from "@/components/guardians/guardian-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewGuardianPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add guardian" />
        <EmptyState
          title="No club found"
          description="Create a club before adding guardians."
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
        title="Add guardian"
        description={`Record a guardian for ${club.name}`}
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
          <CardTitle>Guardian details</CardTitle>
          <CardDescription>
            Contact details. Link players from the guardian&apos;s page after
            saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
