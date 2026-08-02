import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PERSON_ROLE_ORDER, type PersonRoleKind } from "@/lib/people/roles";

export { PERSON_ROLE_ORDER, type PersonRoleKind };

export function RoleChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "border-border bg-background inline-flex max-w-full items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

const ROLE_LABELS: Record<PersonRoleKind, string> = {
  player: "Player",
  guardian: "Guardian",
  coach: "Coach",
  manager: "Manager",
};

export function PersonRoleChips({
  roles,
}: {
  roles: Partial<Record<PersonRoleKind, boolean>>;
}) {
  const active = PERSON_ROLE_ORDER.filter((role) => roles[role]);
  if (active.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Roles">
      {active.map((role) => (
        <li key={role}>
          <RoleChip>{ROLE_LABELS[role]}</RoleChip>
        </li>
      ))}
    </ul>
  );
}
