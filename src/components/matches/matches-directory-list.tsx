"use client";

import type { MatchWithRelations } from "@/lib/data/matches";
import { labelMatchStatus, matchCompetitionLabel } from "@/lib/format";
import {
  MatchListRow,
  matchListContainerClassName,
} from "@/components/matches/match-list-row";
import { MatchSummaryCard } from "@/components/matches/match-summary-card";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";

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
          matchCompetitionLabel(match) ?? "",
          match.is_friendly ? "Friendly" : "",
          labelMatchStatus(match.status),
        ].join(" ")
      }
      filterPlaceholder="Search matches…"
      singularLabel="match"
      pluralLabel="matches"
      defaultPageSize={20}
      emptyFilterTitle="No fixtures match"
      emptyFilterDescription="Try a different opponent, venue, or competition."
      listClassName={matchListContainerClassName}
      renderItem={(match) => (
        <>
          {/* Phones: compact row inside one continuous list. */}
          <div className="sm:hidden">
            <MatchListRow match={match} teamName={teamName} />
          </div>
          {/* sm and up: the existing stacked cards, unchanged. */}
          <div className="hidden sm:block">
            <MatchSummaryCard match={match} teamName={teamName} />
          </div>
        </>
      )}
    />
  );
}
