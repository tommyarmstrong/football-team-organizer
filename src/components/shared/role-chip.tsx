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
        "border-border bg-card inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
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

const ROLE_CHIP_CLASS: Record<PersonRoleKind, string> = {
  player: "border-primary/30 bg-primary/10 text-primary",
  guardian: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  coach: "border-chart-2/50 bg-chart-2/15 text-draw-foreground",
  manager: "border-chart-5/40 bg-chart-5/10 text-chart-5",
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
          <RoleChip className={ROLE_CHIP_CLASS[role]}>
            {ROLE_LABELS[role]}
          </RoleChip>
        </li>
      ))}
    </ul>
  );
}
