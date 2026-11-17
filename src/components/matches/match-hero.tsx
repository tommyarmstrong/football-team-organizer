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
import { LiveIndicator } from "@/components/matches/match-indicators";

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

/** A step under a display score, so the team names stay readable beside it. */
export function matchHeroDigitClassName(): string {
  return "text-3xl sm:text-5xl";
}

/** Cap width on desktop so home/away names stay close; mobile is already this size. */
export function matchHeroFrameClassName(): string {
  return "bg-card ring-border w-full max-w-lg overflow-hidden rounded-3xl shadow-md ring-1";
}

/**
 * Colour of the rail down the left of the card. It follows the result, with
 * the same tokens as the score digits (green win, yellow draw, red loss), and
 * is grey when there is no result yet or at all (scheduled, postponed,
 * cancelled).
 */
export function matchHeroRailClassName(result: "W" | "D" | "L" | null): string {
  if (result === "W") return "border-win";
  if (result === "D") return "border-draw";
  if (result === "L") return "border-loss";
  return "border-muted-foreground/40";
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
export function matchHeroNameClassName(): string {
  return "line-clamp-2 text-sm leading-tight font-semibold break-words sm:text-lg";
}

export function MatchHero({
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
  // A card that is itself a link must not nest a venue link inside it.
  const showVenueLink = Boolean(venueId) && !href;
  const showActions = Boolean(actions);
  const masthead = (
    <div
      className={cn(
        "bg-card text-foreground border-l-[3px] px-4 py-3 sm:px-6 sm:py-6",
        matchHeroRailClassName(result),
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
          <p title={homeName} className={matchHeroNameClassName()}>
            {homeName}
          </p>
        </div>

        <div className="text-center">
          {showScore ? (
            <p
              className={cn(
                "font-display leading-none tracking-tight tabular-nums transition-colors",
                matchHeroDigitClassName(),
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
            <p className="text-muted-foreground px-2 text-xs font-bold tracking-[0.2em] uppercase">
              vs
            </p>
          )}
        </div>

        <div className={matchHeroSideClassName("away")}>
          <p title={awayName} className={matchHeroNameClassName()}>
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
    <div className={matchHeroFrameClassName()}>
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
