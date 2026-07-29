import Link from "next/link";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import type { PlayerGuardianLink } from "@/lib/data/guardians";
import { guardianDisplayName } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";

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
    <ul className="divide-border border-border divide-y rounded-xl border">
      {links.map((link) => (
        <li key={link.player_guardian_id}>
          <Link
            href={`/guardians/${link.guardian_id}`}
            className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="min-w-0">
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
