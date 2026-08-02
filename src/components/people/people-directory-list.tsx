"use client";

import Link from "next/link";
import type { PersonDirectoryItem } from "@/lib/data/people";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";
import { PersonRoleChips } from "@/components/shared/role-chip";

const STATUS_LABELS: Record<string, string> = {
  none: "No login configured",
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

function displayName(
  person: Pick<PersonDirectoryItem, "first_name" | "last_name">,
) {
  return `${person.first_name} ${person.last_name}`.trim();
}

export function PeopleDirectoryList({
  people,
}: {
  people: PersonDirectoryItem[];
}) {
  return (
    <FilterablePaginatedList
      items={people}
      getItemKey={(person) => person.id}
      getSearchText={(person) => `${displayName(person)} ${person.email ?? ""}`}
      filterPlaceholder="Filter people by name or email…"
      singularLabel="person"
      pluralLabel="people"
      defaultPageSize={20}
      emptyFilterTitle="No people match"
      emptyFilterDescription="Try a different name or email."
      renderItem={(person) => (
        <Link
          href={`/people/${person.id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-medium">{displayName(person)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {person.email ?? "No email"} ·{" "}
              {STATUS_LABELS[person.account_status] ?? person.account_status}
            </p>
            <PersonRoleChips roles={person.roles} />
          </div>
        </Link>
      )}
    />
  );
}
