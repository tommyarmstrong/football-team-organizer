"use client";

import Link from "next/link";
import { matchAllowsEvents } from "@/lib/constants";
import type { MatchWithRelations } from "@/lib/data/matches";
import {
  competitionDisplayName,
  labelMatchStatus,
  matchSummaryLines,
} from "@/lib/format";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { objectListRowClassName } from "@/components/shared/object-list";
import { MatchScoreboard } from "@/components/matches/match-scoreboard";
import { LiveIndicator } from "@/components/matches/match-header-meta";

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
      renderItem={(match) => {
        const meta = matchSummaryLines({
          competitionName: match.is_friendly
            ? "Friendly"
            : match.competition
              ? competitionDisplayName(match.competition)
              : null,
          date: match.date,
          kickoffTime: match.kickoff_time,
          meetupTime: match.meetup_time,
          venueName: match.venue?.name,
          status: match.status,
        });
        const showStatusBelow =
          !matchAllowsEvents(match.status) && match.status !== "scheduled";

        return (
          <Link
            href={`/matches/${match.id}`}
            className={objectListRowClassName("flex-col items-stretch gap-2")}
          >
            <MatchScoreboard
              teamName={teamName}
              opponentName={match.opponent_name}
              homeAway={match.home_away}
              status={match.status}
              goalsFor={match.goals_for}
              goalsAgainst={match.goals_against}
              compact
            />
            {match.status === "in_progress" ? (
              <span className="flex justify-center">
                <LiveIndicator />
              </span>
            ) : null}
            {meta.competition ? (
              <p className="text-primary text-center text-sm font-bold">
                {meta.competition}
              </p>
            ) : null}
            {match.status === "scheduled" ? (
              <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                Scheduled
              </p>
            ) : null}
            <p className="text-muted-foreground text-center text-sm">
              {meta.dateTime}
            </p>
            {meta.times ? (
              <p className="text-muted-foreground text-center text-sm">
                {meta.times}
              </p>
            ) : null}
            {meta.venue ? (
              <p className="text-muted-foreground text-center text-sm">
                {meta.venue}
              </p>
            ) : null}
            {showStatusBelow ? (
              <p className="text-muted-foreground text-center text-sm">
                {labelMatchStatus(match.status)}
              </p>
            ) : null}
          </Link>
        );
      }}
    />
  );
}
