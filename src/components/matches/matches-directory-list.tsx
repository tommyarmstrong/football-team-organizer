"use client";

import Link from "next/link";
import { matchAllowsEvents } from "@/lib/constants";
import type { MatchWithRelations } from "@/lib/data/matches";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  labelHomeAway,
  labelMatchStatus,
} from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";

export function MatchesDirectoryList({
  matches,
}: {
  matches: MatchWithRelations[];
  canEdit?: boolean;
}) {
  return (
    <FilterablePaginatedList
      items={matches}
      getItemKey={(match) => match.id}
      getSearchText={(match) =>
        [
          match.opponent_name,
          match.venue?.name ?? "",
          match.competition?.name ?? "",
          labelHomeAway(match.home_away),
          labelMatchStatus(match.status),
        ].join(" ")
      }
      filterPlaceholder="Filter matches by opponent, venue, or competition…"
      singularLabel="match"
      pluralLabel="matches"
      defaultPageSize={20}
      emptyFilterTitle="No fixtures match"
      emptyFilterDescription="Try a different opponent, venue, or competition."
      renderItem={(match) => (
        <Link
          href={`/matches/${match.id}`}
          className={objectListRowClassName("flex-col items-stretch gap-1")}
        >
          <p className="font-medium">{match.opponent_name}</p>
          <p className="text-muted-foreground text-sm">
            {formatMatchDate(match.date)}
            {formatKickoffTime(match.kickoff_time)
              ? ` · ${formatKickoffTime(match.kickoff_time)}`
              : ""}
            {" · "}
            {labelHomeAway(match.home_away)}
          </p>
          {match.venue ? (
            <p className="text-muted-foreground text-sm">{match.venue.name}</p>
          ) : null}
          {match.competition ? (
            <p className="text-muted-foreground text-sm">
              {match.competition.name}
            </p>
          ) : null}
          <p className="text-sm">
            {matchAllowsEvents(match.status) ? (
              <span className="font-medium">
                {formatScore(match.goals_for, match.goals_against)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {labelMatchStatus(match.status)}
              </span>
            )}
          </p>
        </Link>
      )}
    />
  );
}
