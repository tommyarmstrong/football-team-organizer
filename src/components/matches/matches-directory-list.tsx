"use client";

import Link from "next/link";
import type { MatchWithRelations } from "@/lib/data/matches";
import { competitionDisplayName, labelMatchStatus } from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { MatchHero } from "@/components/matches/match-hero";

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
          match.competition ? competitionDisplayName(match.competition) : "",
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
        <Link
          href={`/matches/${match.id}`}
          className="focus-visible:ring-ring block rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <MatchHero
            size="compact"
            teamName={teamName}
            opponentName={match.opponent_name}
            homeAway={match.home_away}
            status={match.status}
            goalsFor={match.goals_for}
            goalsAgainst={match.goals_against}
            competitionName={
              match.is_friendly
                ? "Friendly"
                : match.competition
                  ? competitionDisplayName(match.competition)
                  : null
            }
            date={match.date}
            kickoffTime={match.kickoff_time}
            meetupTime={match.meetup_time}
            venueName={match.venue?.name ?? null}
          />
        </Link>
      )}
    />
  );
}
