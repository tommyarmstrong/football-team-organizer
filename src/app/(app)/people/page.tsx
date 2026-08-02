import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPeople } from "@/lib/data/people";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { PeopleDirectoryList } from "@/components/people/people-directory-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PeoplePage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) redirect("/dashboard");

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return (
      <div className="space-y-8">
        <PageHeader title="People" />
        <EmptyState
          title="No club found"
          description="Create a club first, then manage people and invitations."
        />
      </div>
    );
  }

  const { data: people, error } = await listPeople();

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        actions={
          <Link href="/people/new" className={buttonVariants({ size: "sm" })}>
            Add person
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            All players, coaches, guardians, and managers at {club.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? <ErrorBanner message={error} /> : null}
          {!error && people.length === 0 ? (
            <EmptyState
              title="No people yet"
              description="Add a person with an email address to start invite-only onboarding."
            />
          ) : null}
          {!error && people.length > 0 ? (
            <PeopleDirectoryList people={people} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
