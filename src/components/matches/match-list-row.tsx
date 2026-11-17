import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { MatchWithRelations } from "@/lib/data/matches";
import {
  formatHomeFirstScore,
  formatMatchDate,
  labelMatchStatus,
  matchCompetitionLabel,
  resultLetter,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  matchHeroAriaLabel,
  matchHeroShowsScore,
  matchHeroSides,
} from "@/components/matches/match-hero";
import { LiveIndicator } from "@/components/matches/match-indicators";
import { matchCardShare } from "@/components/matches/match-summary-card";

/**
 * The continuous container that holds every mobile fixture row: one rounded
 * surface with thin separators instead of a stack of individual cards. From
 * `sm` up the list reverts to the stacked cards, so the desktop layout is
 * unchanged.
 */
export const matchListContainerClassName =
  "max-sm:bg-card max-sm:ring-foreground/10 max-sm:divide-border max-sm:divide-y max-sm:overflow-hidden max-sm:rounded-xl max-sm:shadow-sm max-sm:ring-1 sm:space-y-3";

/** Home | score | away on one row; long names wrap rather than push the score. */
export const matchListRowGroupClassName =
  "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3";

export const matchListRowNameClassName =
  "line-clamp-2 min-w-0 text-left text-sm leading-tight font-semibold break-words";

/** "Competition · Venue" on one line, in that order, dropping missing parts. */
export function matchListMetaLine(match: {
  is_friendly?: boolean;
  stage?: MatchWithRelations["stage"];
  competition?: MatchWithRelations["competition"];
  venue?: { name: string } | null;
}): string | null {
  const parts = [
    matchCompetitionLabel(match),
    match.venue?.name?.trim(),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Compact fixture row for the Matches list on phones. Date and LIVE badge sit
 * on the top line, home | score | away on the next, competition · venue below.
 * The whole row opens the match; the share control keeps its own click handler
 * and sits above the row's link so sharing never navigates.
 */
export function MatchListRow({
  match,
  teamName,
}: {
  match: MatchWithRelations;
  teamName: string;
}) {
  const { homeName, awayName } = matchHeroSides(
    teamName,
    match.opponent_name,
    match.home_away,
  );
  const showScore = matchHeroShowsScore(match.status);
  const result = showScore
    ? resultLetter(match.goals_for, match.goals_against)
    : null;
  const [homeGoals, awayGoals] = formatHomeFirstScore(
    match.goals_for,
    match.goals_against,
    match.home_away,
  ).split("–");
  const isLive = match.status === "in_progress";
  const dateLabel = formatMatchDate(match.date);
  const metaLine = matchListMetaLine(match);
  const share = matchCardShare(match);

  // Cancelled and postponed fixtures show no badge, but screen readers still
  // hear the status.
  const statusSuffix =
    match.status === "cancelled" || match.status === "postponed"
      ? `, ${labelMatchStatus(match.status).toLowerCase()}`
      : "";
  const linkLabel = `${matchHeroAriaLabel({
    teamName,
    opponentName: match.opponent_name,
    homeAway: match.home_away,
    status: match.status,
    goalsFor: match.goals_for,
    goalsAgainst: match.goals_against,
  })}, ${dateLabel}${statusSuffix}`;

  return (
    <div
      data-slot="match-list-row"
      className="hover:bg-muted/50 relative px-4 py-3 transition-colors"
    >
      <Link
        href={`/matches/${match.id}`}
        aria-label={linkLabel}
        className="focus-visible:ring-ring absolute inset-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      />

      <div className="flex items-center justify-between gap-2">
        <p
          data-slot="match-list-row-date"
          className="text-muted-foreground text-xs"
        >
          {dateLabel}
        </p>
        {isLive ? <LiveIndicator /> : null}
      </div>

      <div className="mt-1 flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <div className={matchListRowGroupClassName}>
            <p title={homeName} className={matchListRowNameClassName}>
              {homeName}
            </p>

            {showScore ? (
              <p
                data-slot="match-list-row-score"
                className={cn(
                  "font-display text-3xl leading-none tracking-tight tabular-nums",
                  result === "W" && "text-win",
                  result === "D" && "text-draw",
                  result === "L" && "text-loss",
                )}
              >
                <span>{homeGoals}</span>
                <span className="text-muted-foreground px-[0.15em]">–</span>
                <span>{awayGoals}</span>
              </p>
            ) : (
              <p
                data-slot="match-list-row-score"
                className="text-muted-foreground px-2 text-xs font-bold tracking-[0.2em] uppercase"
              >
                vs
              </p>
            )}

            <p title={awayName} className={matchListRowNameClassName}>
              {awayName}
            </p>
          </div>

          {metaLine ? (
            <p
              data-slot="match-list-row-meta"
              title={metaLine}
              className="text-muted-foreground mt-1 truncate text-xs"
            >
              {metaLine}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center">
          {/* Above the row link so tapping share never opens the match. */}
          <div data-slot="match-list-row-share" className="relative z-10">
            {share ?? <span className="block size-11" aria-hidden="true" />}
          </div>
          <ChevronRightIcon
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
