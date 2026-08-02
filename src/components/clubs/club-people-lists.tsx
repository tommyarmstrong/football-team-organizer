"use client";

import Link from "next/link";
import type { CoachWithPerson } from "@/lib/data/coaches";
import type { ManagerWithPerson } from "@/lib/data/managers";
import type { PlayerWithPerson } from "@/lib/data/players";
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
import { objectListRowClassName } from "@/components/shared/object-list";

export function ClubPlayersList({ players }: { players: PlayerWithPerson[] }) {
  return (
    <FilterablePaginatedList
      items={players}
      getItemKey={(player) => player.id}
      getSearchText={(player) => playerDisplayName(player)}
      filterPlaceholder="Filter players by name…"
      singularLabel="player"
      pluralLabel="players"
      defaultPageSize={5}
      emptyFilterTitle="No players match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(player) => (
        <Link
          href={`/people/${player.person_id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{playerDisplayName(player)}</p>
            <p className="text-muted-foreground text-sm">
              {player.position ?? "No position"}
            </p>
          </div>
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
      singularLabel="guardian"
      pluralLabel="guardians"
      defaultPageSize={5}
      emptyFilterTitle="No guardians match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(guardian) => (
        <Link
          href={`/guardians/${guardian.id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{guardianDisplayName(guardian)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {guardian.email ?? guardian.phone ?? "No contact details"}
            </p>
          </div>
          {guardian.players.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {guardian.players.map((link) => (
                <span
                  key={link.player_guardian_id}
                  className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                >
                  {link.player_first_name} {link.player_last_name}
                  {" · "}
                  {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                </span>
              ))}
            </div>
          ) : null}
        </Link>
      )}
    />
  );
}

export function ClubCoachesList({ coaches }: { coaches: CoachWithPerson[] }) {
  return (
    <FilterablePaginatedList
      items={coaches}
      getItemKey={(coach) => coach.id}
      getSearchText={(coach) => coachDisplayName(coach)}
      filterPlaceholder="Filter coaches by name…"
      singularLabel="coach"
      pluralLabel="coaches"
      defaultPageSize={5}
      emptyFilterTitle="No coaches match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(coach) => (
        <Link
          href={`/people/${coach.person_id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{coachDisplayName(coach)}</p>
            <p className="text-muted-foreground text-sm">
              Joined {formatShortDate(coach.joined_date)}
            </p>
          </div>
        </Link>
      )}
    />
  );
}

export function ClubManagersList({
  managers,
}: {
  managers: ManagerWithPerson[];
}) {
  return (
    <FilterablePaginatedList
      items={managers}
      getItemKey={(manager) => manager.id}
      getSearchText={(manager) => managerDisplayName(manager)}
      filterPlaceholder="Filter managers by name…"
      singularLabel="manager"
      pluralLabel="managers"
      defaultPageSize={5}
      emptyFilterTitle="No managers match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(manager) => (
        <Link
          href={`/managers/${manager.id}`}
          className={objectListRowClassName()}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{managerDisplayName(manager)}</p>
            <p className="text-muted-foreground truncate text-sm">
              {manager.email ?? manager.phone ?? "No contact details"}
            </p>
          </div>
        </Link>
      )}
    />
  );
}
