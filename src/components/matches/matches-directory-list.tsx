"use client";

import Link from "next/link";
import { matchAllowsEvents } from "@/lib/constants";
import type { MatchWithRelations } from "@/lib/data/matches";
import {
  formatMatchTitle,
  labelMatchStatus,
  matchSummaryLines,
} from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";

export function MatchesDirectoryList({
  matches,
  teamName,
}: {
  matches: MatchWithRelations[];
  teamName: string;
  canEdit?: boolean;
}) {
  return (
    <FilterablePaginatedList
      items={matches}
      getItemKey={(match) => match.id}
      getSearchText={(match) =>
        [
          match.opponent_name,
          teamName,
          match.venue?.name ?? "",
          match.competition?.name ?? "",
          labelMatchStatus(match.status),
        ].join(" ")
      }
      filterPlaceholder="Filter matches by opponent, venue, or competition…"
      singularLabel="match"
      pluralLabel="matches"
      defaultPageSize={20}
      emptyFilterTitle="No fixtures match"
      emptyFilterDescription="Try a different opponent, venue, or competition."
      renderItem={(match) => {
        const title = formatMatchTitle(
          teamName,
          match.opponent_name,
          match.home_away,
          match.status,
          match.goals_for,
          match.goals_against,
        );
        const meta = matchSummaryLines({
          competitionName: match.competition?.name,
          date: match.date,
          kickoffTime: match.kickoff_time,
          venueName: match.venue?.name,
        });

        return (
          <Link
            href={`/matches/${match.id}`}
            className={objectListRowClassName("flex-col items-stretch gap-1")}
          >
            <p className="font-bold">{title}</p>
            {meta.competition ? (
              <p className="text-muted-foreground text-sm font-bold">
                {meta.competition}
              </p>
            ) : null}
            <p className="text-muted-foreground text-sm">{meta.dateTime}</p>
            {meta.venue ? (
              <p className="text-muted-foreground text-sm">{meta.venue}</p>
            ) : null}
            {!matchAllowsEvents(match.status) ? (
              <p className="text-muted-foreground text-sm">
                {labelMatchStatus(match.status)}
              </p>
            ) : null}
          </Link>
        );
      }}
    />
  );
}
