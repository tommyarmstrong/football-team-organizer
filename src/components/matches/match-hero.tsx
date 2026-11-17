import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatHomeFirstScore,
  formatMatchTitle,
  labelMatchStatus,
  matchSummaryLines,
  resultLetter,
} from "@/lib/format";
import type { MatchHomeAway, MatchStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { MatchCardMeta } from "@/components/matches/match-card-meta";
import {
  LiveIndicator,
  ScheduledIndicator,
} from "@/components/matches/match-indicators";

export type MatchHeroSize = "hero" | "card" | "compact";

export function matchHeroShowsScore(status: MatchStatus): boolean {
  return status === "played" || status === "in_progress";
}

export function matchHeroSides(
  teamName: string,
  opponentName: string,
  homeAway: MatchHomeAway | null | undefined,
): { homeName: string; awayName: string } {
  const isAway = homeAway === "away";
  return {
    homeName: isAway ? opponentName : teamName,
    awayName: isAway ? teamName : opponentName,
  };
}

export function matchHeroAriaLabel({
  teamName,
  opponentName,
  homeAway,
  status,
  goalsFor,
  goalsAgainst,
}: {
  teamName: string;
  opponentName: string;
  homeAway: MatchHomeAway | null | undefined;
  status: MatchStatus;
  goalsFor: number;
  goalsAgainst: number;
}): string {
  return formatMatchTitle(
    teamName,
    opponentName,
    homeAway,
    status,
    goalsFor,
    goalsAgainst,
  );
}

export function matchHeroDigitClassName(size: MatchHeroSize): string {
  if (size === "hero") return "text-4xl sm:text-6xl";
  if (size === "card") return "text-4xl sm:text-5xl";
  return "text-4xl";
}

/** Cap width on desktop so home/away names stay close; mobile is already this size. */
export function matchHeroFrameClassName(size: MatchHeroSize): string {
  return cn(
    "bg-card ring-foreground/10 w-full max-w-lg overflow-hidden shadow-md ring-1",
    size === "compact" ? "rounded-2xl" : "rounded-3xl",
  );
}

/** Home | score | away on one row, on every size and breakpoint. */
export function matchHeroGroupClassName(): string {
  return "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3";
}

/** Names flank the score, aligned towards it: home on the left, away on the right. */
export function matchHeroSideClassName(side: "home" | "away"): string {
  return side === "home" ? "min-w-0 text-right" : "min-w-0 text-left";
}

/** Long names wrap to two lines and keep their full text in the title. */
export function matchHeroNameClassName(size: MatchHeroSize): string {
  return cn(
    "line-clamp-2 leading-tight font-semibold break-words",
    size === "hero" ? "text-sm sm:text-lg" : "text-sm",
  );
}

export function MatchHero({
  size = "hero",
  teamName,
  opponentName,
  homeAway,
  status,
  goalsFor,
  goalsAgainst,
  competitionName,
  date,
  kickoffTime,
  meetupTime,
  venueName,
  venueId,
  actions,
  href,
}: {
  size?: MatchHeroSize;
  teamName: string;
  opponentName: string;
  homeAway: MatchHomeAway | null | undefined;
  status: MatchStatus;
  goalsFor: number;
  goalsAgainst: number;
  competitionName?: string | null;
  date?: string;
  kickoffTime?: string | null;
  meetupTime?: string | null;
  venueName?: string | null;
  venueId?: string | null;
  actions?: ReactNode;
  href?: string;
}) {
  const { homeName, awayName } = matchHeroSides(
    teamName,
    opponentName,
    homeAway,
  );
  const showScore = matchHeroShowsScore(status);
  const result = showScore ? resultLetter(goalsFor, goalsAgainst) : null;
  const score = formatHomeFirstScore(goalsFor, goalsAgainst, homeAway);
  const [homeGoals, awayGoals] = score.split("–");
  const isLive = status === "in_progress";
  const isCancelledOrPostponed =
    status === "cancelled" || status === "postponed";
  const ariaLabel = matchHeroAriaLabel({
    teamName,
    opponentName,
    homeAway,
    status,
    goalsFor,
    goalsAgainst,
  });
  const meta =
    date != null
      ? matchSummaryLines({
          competitionName,
          date,
          kickoffTime: kickoffTime ?? null,
          meetupTime,
          venueName,
          status,
        })
      : null;
  const showVenueLink = size === "hero" && Boolean(venueId);

  const isHero = size === "hero";
  const mastheadPadding = isHero
    ? "px-4 py-3 sm:px-6 sm:py-6"
    : size === "card"
      ? "px-4 py-4 sm:px-5 sm:py-5"
      : "px-4 py-3.5";

  const showActions = Boolean(actions);
  const showScheduledBadge = status === "scheduled" && !isHero;
  const masthead = (
    <div
      className={cn(
        "bg-card text-foreground border-hero-rail border-l-[3px]",
        mastheadPadding,
      )}
    >
      {isLive ? (
        <div className="mb-1.5 flex justify-center">
          <LiveIndicator />
        </div>
      ) : null}

      <div
        role="group"
        aria-label={ariaLabel}
        className={matchHeroGroupClassName()}
      >
        <div className={matchHeroSideClassName("home")}>
          <p title={homeName} className={matchHeroNameClassName(size)}>
            {homeName}
          </p>
        </div>

        <div className="text-center">
          {showScore ? (
            <p
              className={cn(
                "font-display leading-none tracking-tight tabular-nums transition-colors",
                matchHeroDigitClassName(size),
                result === "W" && "text-win",
                result === "D" && "text-draw",
                result === "L" && "text-loss",
              )}
            >
              <span>{homeGoals}</span>
              <span className="text-muted-foreground px-[0.15em]">–</span>
              <span>{awayGoals}</span>
            </p>
          ) : showScheduledBadge ? (
            <div className="flex justify-center">
              <ScheduledIndicator />
            </div>
          ) : (
            <p className="text-muted-foreground px-2 text-xs font-bold tracking-[0.2em] uppercase">
              vs
            </p>
          )}
        </div>

        <div className={matchHeroSideClassName("away")}>
          <p title={awayName} className={matchHeroNameClassName(size)}>
            {awayName}
          </p>
        </div>

        {isCancelledOrPostponed ? (
          <p className="text-destructive col-span-full mt-2 text-center font-medium">
            {labelMatchStatus(status)}
          </p>
        ) : null}
      </div>

      {meta ? (
        <MatchCardMeta
          meta={meta}
          venueHref={showVenueLink ? `/venues/${venueId}` : undefined}
        />
      ) : null}
    </div>
  );

  return (
    <div className={matchHeroFrameClassName(size)}>
      {href ? (
        <Link
          href={href}
          className="focus-visible:ring-ring block rounded-[inherit] transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none"
        >
          {masthead}
        </Link>
      ) : (
        masthead
      )}

      {showActions ? (
        <div className="flex min-h-11 w-full items-center justify-center gap-1 px-2 py-1">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
