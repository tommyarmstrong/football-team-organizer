import Link from "next/link";
import { redirect } from "next/navigation";
import {
  canAccessClubAndPeople,
  canManageClub,
  getViewerContext,
} from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPeople, listPreviousMembers } from "@/lib/data/people";
import {
  directoryDescription,
  directoryShowsAccountDetails,
  filterPeopleDirectory,
  redactDirectoryEmergencyContact,
} from "@/lib/people/directory";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Section } from "@/components/shared/section";
import { PeopleDirectoryList } from "@/components/people/people-directory-list";
import { buttonVariants } from "@/components/ui/button";

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
  const showAccountDetailsFor = visiblePeople
    .filter((person) => directoryShowsAccountDetails(person, ctx, club.id))
    .map((person) => person.id);

  const previousMembersResult = canEdit
    ? await listPreviousMembers()
    : { data: [], error: null as string | null };
  const previousMembers = previousMembersResult.data;
  const previousError = previousMembersResult.error;

  return (
    <div className="space-y-8">
      <PageHeader
        title="People"
        description={directoryDescription(ctx, club.id, club.name)}
        actions={
          canEdit ? (
            <Link href="/people/new" className={buttonVariants({ size: "sm" })}>
              Add person
            </Link>
          ) : undefined
        }
      />

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
        <PeopleDirectoryList
          people={visiblePeople}
          showAccountDetailsFor={showAccountDetailsFor}
        />
      ) : null}

      {canEdit ? (
        <Section
          title="Previous members"
          description="People whose accounts are disabled. Reactivate them, assign roles, and relink a login from their profile."
        >
          {previousError ? <ErrorBanner message={previousError} /> : null}
          {!previousError && previousMembers.length === 0 ? (
            <EmptyState
              title="No previous members"
              description="Disabled people appear here after they are deleted from People."
            />
          ) : null}
          {!previousError && previousMembers.length > 0 ? (
            <PeopleDirectoryList
              people={previousMembers}
              showAccountDetailsFor={previousMembers.map((person) => person.id)}
            />
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
