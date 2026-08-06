import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClubForm } from "@/components/clubs/club-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EditClubPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) {
    redirect("/dashboard");
  }

  const club = await getPrimaryClub();

  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-8">
        <PageHeader title="Edit club" />
        <EmptyState
          title="No club found"
          description="Create a club from the no-access page, or ask an administrator for help."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit club details"
        description={club.name}
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
          <CardTitle>Club details</CardTitle>
          <CardDescription>
            Update name, branding, contact details, and philosophy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm
            key={`${club.updated_at}-${club.icon_url ?? ""}-${club.colour ?? ""}`}
            club={club}
          />
        </CardContent>
      </Card>
    </div>
  );
}
