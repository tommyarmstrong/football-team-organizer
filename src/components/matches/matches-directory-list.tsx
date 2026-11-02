"use client";

import type { MatchWithRelations } from "@/lib/data/matches";
import { labelMatchStatus, matchCompetitionLabel } from "@/lib/format";
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
      filterPlaceholder="Filter matches by opponent, venue, or competition…"
      singularLabel="match"
      pluralLabel="matches"
      defaultPageSize={20}
      emptyFilterTitle="No fixtures match"
      emptyFilterDescription="Try a different opponent, venue, or competition."
      listClassName="space-y-3"
      renderItem={(match) => (
        <MatchSummaryCard match={match} teamName={teamName} />
      )}
    />
  );
}
