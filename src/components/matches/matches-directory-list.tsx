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
import { deleteMatchAction } from "@/lib/matches/actions";
import { FilterablePaginatedList } from "@/components/shared/filterable-paginated-list";
import { ListDeleteButton } from "@/components/shared/list-delete-button";
import { objectListRowClassName } from "@/components/shared/object-list";

export function MatchesDirectoryList({
  matches,
  canEdit,
}: {
  matches: MatchWithRelations[];
  canEdit: boolean;
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
        <div className="flex items-stretch">
          <Link
            href={`/matches/${match.id}`}
            className={objectListRowClassName(
              "flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div>
              <p className="font-medium">{match.opponent_name}</p>
              <p className="text-muted-foreground text-sm">
                {formatMatchDate(match.date)}
                {formatKickoffTime(match.kickoff_time)
                  ? ` · ${formatKickoffTime(match.kickoff_time)}`
                  : ""}
                {" · "}
                {labelHomeAway(match.home_away)}
                {match.venue ? ` · ${match.venue.name}` : ""}
                {match.competition ? ` · ${match.competition.name}` : ""}
              </p>
            </div>
            <div className="text-sm sm:text-right">
              {matchAllowsEvents(match.status) ? (
                <p className="font-medium">
                  {formatScore(match.goals_for, match.goals_against)}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {labelMatchStatus(match.status)}
                </p>
              )}
            </div>
          </Link>
          {canEdit ? (
            <div className="flex items-center pr-2">
              <ListDeleteButton
                label={`Delete match vs ${match.opponent_name}`}
                confirmMessage={`Delete the match against ${match.opponent_name}? This cannot be undone.`}
                deleteAction={deleteMatchAction.bind(null, match.id)}
              />
            </div>
          ) : null}
        </div>
      )}
    />
  );
}
