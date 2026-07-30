"use client";

import Link from "next/link";
import type { Coach, Manager, Player } from "@/lib/supabase/database.types";
import type { GuardianWithPlayers } from "@/lib/data/guardians";
import {
  coachDisplayName,
  formatShortDate,
  guardianDisplayName,
  managerDisplayName,
  playerDisplayName,
} from "@/lib/format";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";

const rowLinkClassName =
  "hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none";

export function ClubPlayersList({ players }: { players: Player[] }) {
  return (
    <FilterablePaginatedList
      items={players}
      getItemKey={(player) => player.id}
      getSearchText={(player) => playerDisplayName(player)}
      filterPlaceholder="Filter players by name…"
      emptyFilterTitle="No players match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(player) => (
        <Link href={`/players/${player.id}`} className={rowLinkClassName}>
          <div>
            <p className="font-medium">{playerDisplayName(player)}</p>
            <p className="text-muted-foreground text-sm">
              {player.position ?? "No position"}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">Edit</span>
        </Link>
      )}
    />
  );
}

export function ClubGuardiansList({
  guardians,
}: {
  guardians: GuardianWithPlayers[];
}) {
  return (
    <FilterablePaginatedList
      items={guardians}
      getItemKey={(guardian) => guardian.id}
      getSearchText={(guardian) => guardianDisplayName(guardian)}
      filterPlaceholder="Filter guardians by name…"
      emptyFilterTitle="No guardians match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(guardian) => (
        <Link href={`/guardians/${guardian.id}`} className={rowLinkClassName}>
          <div className="min-w-0">
            <p className="font-medium">{guardianDisplayName(guardian)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {guardian.email ?? guardian.phone ?? "No contact details"}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {guardian.players.length === 0 ? (
              <span className="text-muted-foreground text-xs">Edit</span>
            ) : (
              guardian.players.map((link) => (
                <span
                  key={link.player_guardian_id}
                  className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                >
                  {link.player_first_name} {link.player_last_name}
                  {" · "}
                  {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                </span>
              ))
            )}
          </div>
        </Link>
      )}
    />
  );
}

export function ClubCoachesList({ coaches }: { coaches: Coach[] }) {
  return (
    <FilterablePaginatedList
      items={coaches}
      getItemKey={(coach) => coach.id}
      getSearchText={(coach) => coachDisplayName(coach)}
      filterPlaceholder="Filter coaches by name…"
      emptyFilterTitle="No coaches match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(coach) => (
        <Link href={`/coaches/${coach.id}`} className={rowLinkClassName}>
          <div>
            <p className="font-medium">{coachDisplayName(coach)}</p>
            <p className="text-muted-foreground text-sm">
              Joined {formatShortDate(coach.joined_date)}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">Edit</span>
        </Link>
      )}
    />
  );
}

export function ClubManagersList({ managers }: { managers: Manager[] }) {
  return (
    <FilterablePaginatedList
      items={managers}
      getItemKey={(manager) => manager.id}
      getSearchText={(manager) => managerDisplayName(manager)}
      filterPlaceholder="Filter managers by name…"
      emptyFilterTitle="No managers match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(manager) => (
        <Link href={`/managers/${manager.id}`} className={rowLinkClassName}>
          <div className="min-w-0">
            <p className="font-medium">{managerDisplayName(manager)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {manager.email ?? manager.phone ?? "No contact details"}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">Edit</span>
        </Link>
      )}
    />
  );
}
