import Link from "next/link";
import { PhoneIcon } from "lucide-react";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import type { PlayerGuardianLink } from "@/lib/data/guardians";
import { guardianDisplayName } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";
import { RoleChip } from "@/components/shared/role-chip";

export function PlayerGuardiansSection({
  links,
}: {
  links: PlayerGuardianLink[];
}) {
  if (links.length === 0) {
    return (
      <EmptyState
        title="No guardians linked"
        description="Guardians linked to this player will appear here."
      />
    );
  }

  return (
    <ul className={objectListClassName}>
      {links.map((link) => (
        <li key={link.player_guardian_id}>
          <Link
            href={`/guardians/${link.guardian_id}`}
            className={objectListRowClassName()}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{guardianDisplayName(link)}</p>
            </div>
            <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <RoleChip>
                {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
              </RoleChip>
              {link.legal_guardian ? <RoleChip>Legal guardian</RoleChip> : null}
              {link.phone ? (
                <RoleChip>
                  <PhoneIcon className="size-3 shrink-0" aria-hidden="true" />
                  {link.phone}
                </RoleChip>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
