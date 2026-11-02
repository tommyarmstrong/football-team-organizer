"use client";

import { matchAllowsPostcard } from "@/lib/constants";
import type { MatchWithRelations } from "@/lib/data/matches";
import { labelMatchStatus, matchCompetitionLabel } from "@/lib/format";
import { MatchHero } from "@/components/matches/match-hero";
import { MatchCardShare } from "@/components/postcards/match-card-share";
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
        <MatchHero
          size="compact"
          href={`/matches/${match.id}`}
          teamName={teamName}
          opponentName={match.opponent_name}
          homeAway={match.home_away}
          status={match.status}
          goalsFor={match.goals_for}
          goalsAgainst={match.goals_against}
          competitionName={matchCompetitionLabel(match)}
          date={match.date}
          kickoffTime={match.kickoff_time}
          meetupTime={match.meetup_time}
          venueName={match.venue?.name ?? null}
          actions={
            matchAllowsPostcard(match.status) ? (
              <MatchCardShare
                matchId={match.id}
                kind={match.status === "scheduled" ? "scheduled" : "played"}
              />
            ) : undefined
          }
        />
      )}
    />
  );
}
