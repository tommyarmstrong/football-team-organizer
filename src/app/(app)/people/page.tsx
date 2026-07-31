import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { listPeople } from "@/lib/data/people";
import { personDisplayName } from "@/lib/people/person";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  none: "No account",
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

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
        description="Shared identity records for invitations and multi-role accounts."
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
            Create a person, link role records, then send an invite-only login.
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
            <FilterablePaginatedList
              items={people}
              getItemKey={(person) => person.id}
              getSearchText={(person) =>
                `${personDisplayName(person)} ${person.email ?? ""}`
              }
              filterPlaceholder="Filter people by name or email…"
              emptyFilterTitle="No people match"
              emptyFilterDescription="Try a different name or email."
              renderItem={(person) => (
                <Link
                  href={`/people/${person.id}`}
                  className={objectListRowClassName()}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{personDisplayName(person)}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {person.email ?? "No email"} ·{" "}
                      {STATUS_LABELS[person.account_status] ??
                        person.account_status}
                    </p>
                  </div>
                </Link>
              )}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
