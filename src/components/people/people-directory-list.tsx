"use client";

import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import type { PersonDirectoryItem } from "@/lib/data/people";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
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

function hasLoginEligibleRole(person: PersonDirectoryItem): boolean {
  return person.roles.coach || person.roles.guardian || person.roles.manager;
}

function loginStatusLine(person: PersonDirectoryItem): string | null {
  if (!hasLoginEligibleRole(person)) return null;

  if (!person.email && person.account_status === "none") {
    return "No email - no login configured";
  }

  const emailPart = person.email ?? "No email";
  const statusPart =
    STATUS_LABELS[person.account_status] ?? person.account_status;
  return `${emailPart} · ${statusPart}`;
}

export function missingEmergencyContact(
  person: Pick<PersonDirectoryItem, "roles" | "emergency_contact">,
): boolean {
  return person.roles.player && !person.emergency_contact;
}

export function PeopleDirectoryList({
  people,
  showAccountDetailsFor,
}: {
  people: PersonDirectoryItem[];
  /** Person ids whose login/email line may be shown. Omit to show for everyone. */
  showAccountDetailsFor?: string[];
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
      renderItem={(person) => {
        const name = displayName(person);
        const loginLine =
          showAccountDetailsFor != null &&
          !showAccountDetailsFor.includes(person.id)
            ? null
            : loginStatusLine(person);

        return (
          <Link
            href={`/people/${person.id}`}
            aria-label={name}
            className={objectListRowClassName("cursor-pointer")}
          >
            <InitialsAvatar name={name} className="size-10" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-medium">{name}</p>
              {loginLine ? (
                <p className="text-muted-foreground truncate text-sm">
                  {loginLine}
                </p>
              ) : null}
              <PersonRoleChips roles={person.roles} />
              {missingEmergencyContact(person) ? (
                <span className="text-destructive border-destructive/40 bg-destructive/10 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold">
                  <TriangleAlertIcon className="size-3.5" aria-hidden />
                  No emergency contact
                </span>
              ) : null}
            </div>
          </Link>
        );
      }}
    />
  );
}
