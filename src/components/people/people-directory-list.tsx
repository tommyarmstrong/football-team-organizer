"use client";

import Link from "next/link";
import type { Person } from "@/lib/supabase/database.types";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";

const STATUS_LABELS: Record<string, string> = {
  none: "No account",
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

function displayName(person: Pick<Person, "first_name" | "last_name">) {
  return `${person.first_name} ${person.last_name}`.trim();
}

export function PeopleDirectoryList({ people }: { people: Person[] }) {
  return (
    <FilterablePaginatedList
      items={people}
      getItemKey={(person) => person.id}
      getSearchText={(person) => `${displayName(person)} ${person.email ?? ""}`}
      filterPlaceholder="Filter people by name or email…"
      emptyFilterTitle="No people match"
      emptyFilterDescription="Try a different name or email."
      renderItem={(person) => (
        <Link
          href={`/people/${person.id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{displayName(person)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {person.email ?? "No email"} ·{" "}
              {STATUS_LABELS[person.account_status] ?? person.account_status}
            </p>
          </div>
        </Link>
      )}
    />
  );
}
