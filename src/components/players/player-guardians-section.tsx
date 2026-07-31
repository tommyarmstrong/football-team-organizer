import Link from "next/link";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import type { PlayerGuardianLink } from "@/lib/data/guardians";
import { guardianDisplayName } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import {
  objectListClassName,
  objectListRowClassName,
} from "@/components/shared/object-list";

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
              <p className="text-muted-foreground truncate text-sm">
                {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                {link.legal_guardian ? " · Legal guardian" : ""}
                {link.phone ? ` · ${link.phone}` : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
