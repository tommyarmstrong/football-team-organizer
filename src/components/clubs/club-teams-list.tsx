"use client";

import type { Team } from "@/lib/supabase/database.types";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { ClubTeamLink } from "@/components/clubs/club-team-link";

export function ClubTeamsList({ teams }: { teams: Team[] }) {
  return (
    <FilterablePaginatedList
      items={teams}
      getItemKey={(team) => team.id}
      getSearchText={(team) =>
        `${team.name} ${team.age_group} ${team.season_label}${
          team.archived_at ? " archived" : ""
        }`
      }
      filterPlaceholder="Filter teams by name or season…"
      singularLabel="team"
      pluralLabel="teams"
      defaultPageSize={5}
      emptyFilterTitle="No teams match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(team) => <ClubTeamLink team={team} />}
    />
  );
}
