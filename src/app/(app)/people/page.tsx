import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canAccessClubAndPeople,
  canManageClub,
  getViewerContext,
} from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPeople } from "@/lib/data/people";
import {
  directoryDescription,
  filterPeopleDirectory,
  redactDirectoryEmergencyContact,
} from "@/lib/people/directory";
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
  if (!ctx || !canAccessClubAndPeople(ctx)) redirect("/dashboard");

  const club = await getPrimaryClub();
  if (!club) {
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

  const canEdit = canManageClub(ctx, club.id);
  const { data: people, error } = await listPeople();
  const visiblePeople = error
    ? []
    : filterPeopleDirectory(people, ctx, club.id).map((person) =>
        redactDirectoryEmergencyContact(person, ctx, club.id),
      );

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        actions={
          canEdit ? (
            <Link href="/people/new" className={buttonVariants({ size: "sm" })}>
              Add person
            </Link>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            {directoryDescription(ctx, club.id, club.name)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? <ErrorBanner message={error} /> : null}
          {!error && visiblePeople.length === 0 ? (
            <EmptyState
              title="No people yet"
              description={
                canEdit
                  ? "Add a person with an email address to start invite-only onboarding."
                  : "No people are visible with your current access."
              }
            />
          ) : null}
          {!error && visiblePeople.length > 0 ? (
            <PeopleDirectoryList people={visiblePeople} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
