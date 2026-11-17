import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatHomeFirstScore,
  formatMatchTitle,
  labelHomeAway,
  labelMatchStatus,
  matchSummaryLines,
  resultLetter,
} from "@/lib/format";
import type { MatchHomeAway, MatchStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import {
  LiveIndicator,
  ScheduledIndicator,
} from "@/components/matches/match-header-meta";

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
  // The detail-page hero is compact on phones and keeps its desktop scale from sm.
  if (size === "hero") return "text-4xl sm:text-6xl";
  if (size === "card") return "text-5xl";
  return "text-4xl";
}

/** Cap width on desktop so home/away names stay close; mobile is already this size. */
export function matchHeroFrameClassName(size: MatchHeroSize): string {
  return cn(
    "bg-card ring-foreground/10 w-full max-w-lg overflow-hidden shadow-md ring-1",
    size === "compact" ? "rounded-2xl" : "rounded-3xl",
  );
}

/**
 * Home | score | away on one row for the phone-width detail hero; from `sm`
 * the original two-column names + score row is restored via explicit grid
 * placement (see the side and score cell helpers).
 */
export function matchHeroGroupClassName(size: MatchHeroSize): string {
  if (size !== "hero") return "grid grid-cols-2 gap-3";
  return "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-2 sm:items-start sm:gap-3";
}

/** Names flank the score on phones (aligned towards it); desktop is unchanged. */
export function matchHeroSideClassName(
  size: MatchHeroSize,
  side: "home" | "away",
): string {
  if (size !== "hero") return cn("min-w-0", side === "away" && "text-right");
  return side === "home"
    ? "min-w-0 text-right sm:col-start-1 sm:row-start-1 sm:text-left"
    : "min-w-0 text-left sm:col-start-2 sm:row-start-1 sm:text-right";
}

export function matchHeroScoreCellClassName(size: MatchHeroSize): string {
  if (size !== "hero") return "col-span-2 text-center";
  return "text-center sm:col-span-2 sm:col-start-1 sm:row-start-2";
}

/** Long names wrap to two lines on phones and truncate on desktop. */
export function matchHeroNameClassName(size: MatchHeroSize): string {
  if (size === "hero") {
    return "font-semibold text-sm break-words max-sm:line-clamp-2 max-sm:leading-tight sm:truncate sm:text-lg";
  }
  return "truncate font-semibold text-sm";
}

/** Venue, competition and date flow on shared lines on phones (hero only). */
export function matchHeroMetaClassName(size: MatchHeroSize): string {
  if (size !== "hero") {
    return "text-muted-foreground mt-4 space-y-1 text-center text-sm";
  }
  return "text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-xs sm:mt-4 sm:block sm:space-y-1 sm:text-sm";
}

export function matchHeroMetaItemClassName(size: MatchHeroSize): string {
  if (size !== "hero") return "";
  // The middle dot is written as the CSS escape \00b7 (via String.raw so the
  // class Tailwind scans is the same text) and never depends on CSS encoding.
  return String.raw`max-sm:not-last:after:ml-2 max-sm:not-last:after:content-['\00b7']`;
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
  const mastheadPadding =
    isLive && isHero
      ? "px-4 py-3 sm:px-6 sm:py-4"
      : isHero
        ? "px-4 py-3 sm:px-6 sm:py-6"
        : size === "card"
          ? "px-4 py-4 sm:px-5 sm:py-5"
          : "px-4 py-3.5";

  const showActions = Boolean(actions);
  const showScheduledBadge = status === "scheduled" && !isHero;
  const metaItemClassName = matchHeroMetaItemClassName(size);
  const masthead = (
    <div
      className={cn(
        "bg-card text-foreground border-hero-rail border-l-[3px]",
        mastheadPadding,
      )}
    >
      <div
        role="group"
        aria-label={ariaLabel}
        className={matchHeroGroupClassName(size)}
      >
        <div className={matchHeroSideClassName(size, "home")}>
          <p
            className={cn(
              "text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase",
              isHero && "max-sm:hidden",
            )}
          >
            Home
          </p>
          <p title={homeName} className={matchHeroNameClassName(size)}>
            {homeName}
          </p>
        </div>

        <div className={matchHeroScoreCellClassName(size)}>
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

        <div className={matchHeroSideClassName(size, "away")}>
          <p
            className={cn(
              "text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase",
              isHero && "max-sm:hidden",
            )}
          >
            Away
          </p>
          <p title={awayName} className={matchHeroNameClassName(size)}>
            {awayName}
          </p>
        </div>

        {isCancelledOrPostponed ? (
          <p
            className={cn(
              "text-destructive col-span-full text-center font-medium",
              // Desktop and non-hero sizes keep the original 8px gap under the score.
              isHero ? "mt-1 sm:row-start-3 sm:-mt-1" : "-mt-1",
            )}
          >
            {labelMatchStatus(status)}
          </p>
        ) : null}
      </div>

      {homeAway || meta || isLive ? (
        <div
          data-slot="match-card-stack"
          className={matchHeroMetaClassName(size)}
        >
          {homeAway ? (
            <p
              className={cn(
                "text-[11px] font-medium tracking-wide uppercase",
                isHero && "max-sm:hidden",
              )}
            >
              {labelHomeAway(homeAway)}
            </p>
          ) : null}
          {meta?.venue ? (
            <p className={metaItemClassName}>
              {showVenueLink ? (
                <Link
                  href={`/venues/${venueId}`}
                  className="text-foreground underline-offset-2 hover:underline max-sm:-my-2 max-sm:inline-block max-sm:py-2"
                >
                  {meta.venue}
                </Link>
              ) : (
                meta.venue
              )}
            </p>
          ) : null}
          {isLive ? (
            <div className={cn("flex justify-center", metaItemClassName)}>
              <LiveIndicator />
            </div>
          ) : null}
          {meta?.competition ? (
            <p className={cn("text-foreground font-bold", metaItemClassName)}>
              {meta.competition}
            </p>
          ) : null}
          {meta ? <p className={metaItemClassName}>{meta.dateTime}</p> : null}
          {meta?.meetup ? (
            <p className={metaItemClassName}>{meta.meetup}</p>
          ) : null}
          {meta?.kickoff ? (
            <p className={metaItemClassName}>{meta.kickoff}</p>
          ) : null}
        </div>
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
