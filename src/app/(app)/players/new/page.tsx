import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlayerForm } from "@/components/players/player-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPlayerPage() {
  const [ctx, club] = await Promise.all([getViewerContext(), getPrimaryClub()]);

  const canAdd = Boolean(
    ctx && (ctx.isManagement || ctx.coachTeamIds.length > 0),
  );

  if (!canAdd) {
    redirect("/dashboard");
  }

  if (!club) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add player" />
        <EmptyState
          title="No club found"
          description="Create a club before adding players."
        />
      </div>
    );
  }

  const backHref = ctx?.isManagement ? "/club" : "/team";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add player"
        description={`Add a player to ${club.name}`}
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
          <CardTitle>Player details</CardTitle>
          <CardDescription>
            Players belong to the club and can be assigned to one or more teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
