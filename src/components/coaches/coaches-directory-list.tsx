"use client";

import Link from "next/link";
import type { CoachWithTeams } from "@/lib/data/coaches";
import { coachDisplayName, formatShortDate } from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";

function qualificationSummary(coach: {
  dbs_checked: boolean;
  fa_level_1: boolean;
  fa_level_2: boolean;
}): string {
  const parts: string[] = [];
  if (coach.dbs_checked) parts.push("DBS");
  if (coach.fa_level_1) parts.push("FA L1");
  if (coach.fa_level_2) parts.push("FA L2");
  return parts.length > 0 ? parts.join(" · ") : "No qualifications recorded";
}

export function CoachesDirectoryList({
  coaches,
}: {
  coaches: CoachWithTeams[];
}) {
  return (
    <FilterablePaginatedList
      items={coaches}
      getItemKey={(coach) => coach.id}
      getSearchText={(coach) =>
        `${coachDisplayName(coach)} ${coach.teams.map((t) => t.team_name).join(" ")}`
      }
      filterPlaceholder="Filter coaches by name…"
      singularLabel="coach"
      pluralLabel="coaches"
      defaultPageSize={20}
      emptyFilterTitle="No coaches match"
      emptyFilterDescription="Try a different name, or clear the filter."
      renderItem={(coach) => (
        <Link
          href={`/coaches/${coach.id}`}
          className={objectListRowClassName("justify-between")}
        >
          <div className="min-w-0">
            <p className="font-medium">{coachDisplayName(coach)}</p>
            <p className="text-muted-foreground text-sm">
              Joined {formatShortDate(coach.joined_date)} ·{" "}
              {qualificationSummary(coach)}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {coach.teams.length === 0 ? (
              <span className="text-muted-foreground text-xs">No teams</span>
            ) : (
              coach.teams.map((team) => (
                <span
                  key={team.team_coach_id}
                  className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                >
                  {team.team_name}
                </span>
              ))
            )}
          </div>
        </Link>
      )}
    />
  );
}
