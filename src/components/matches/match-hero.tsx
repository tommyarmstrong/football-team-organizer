import Link from "next/link";
import type { ReactNode } from "react";
import { CARD_TYPE_EMOJIS } from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import {
  coachDisplayName,
  formatHomeFirstScore,
  formatMatchTitle,
  guardianDisplayName,
  labelHomeAway,
  labelMatchStatus,
  matchSummaryLines,
  playerDisplayName,
  resultLetter,
} from "@/lib/format";
import type { MatchHomeAway, MatchStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { LiveIndicator } from "@/components/matches/match-header-meta";

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
  if (size === "hero") return "text-6xl";
  if (size === "card") return "text-5xl";
  return "text-4xl";
}

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
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
  matchDaySquadCount,
  cards,
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
  matchDaySquadCount?: number;
  cards?: CardWithPerson[];
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
  const showFullMeta = size === "hero" && !isLive;
  const showSquad =
    showFullMeta && !isCancelledOrPostponed && matchDaySquadCount != null;
  const visibleCards =
    showFullMeta && !isCancelledOrPostponed && cards ? cards : [];
  const showVenueLink = size === "hero" && Boolean(venueId);

  const mastheadPadding =
    isLive && size === "hero"
      ? "px-5 py-4 sm:px-6"
      : size === "hero"
        ? "px-5 py-5 sm:px-6 sm:py-6"
        : size === "card"
          ? "px-4 py-4 sm:px-5 sm:py-5"
          : "px-4 py-3.5";

  const showActions = Boolean(actions) && (size === "hero" || size === "card");
  const masthead = (
    <div
      className={cn(
        "bg-card text-foreground border-hero-rail border-l-[3px]",
        mastheadPadding,
      )}
    >
      <div role="group" aria-label={ariaLabel}>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
              Home
            </p>
            <p
              className={cn(
                "truncate font-semibold",
                size === "hero" ? "text-base sm:text-lg" : "text-sm",
              )}
            >
              {homeName}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
              Away
            </p>
            <p
              className={cn(
                "truncate font-semibold",
                size === "hero" ? "text-base sm:text-lg" : "text-sm",
              )}
            >
              {awayName}
            </p>
          </div>
        </div>

        <div className="mt-3 text-center">
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
          ) : (
            <p className="text-muted-foreground px-2 text-xs font-bold tracking-[0.2em] uppercase">
              vs
            </p>
          )}
          {isCancelledOrPostponed ? (
            <p className="text-destructive mt-2 font-medium">
              {labelMatchStatus(status)}
            </p>
          ) : null}
        </div>
      </div>

      {homeAway || meta || isLive ? (
        <div className="text-muted-foreground mt-4 space-y-1 text-center text-sm">
          {homeAway ? (
            <p className="text-[11px] font-medium tracking-wide uppercase">
              {labelHomeAway(homeAway)}
            </p>
          ) : null}
          {meta?.venue ? (
            <p>
              {showVenueLink ? (
                <Link
                  href={`/venues/${venueId}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {meta.venue}
                </Link>
              ) : (
                meta.venue
              )}
            </p>
          ) : null}
          {isLive ? (
            <div className="flex justify-center">
              <LiveIndicator />
            </div>
          ) : null}
          {meta?.competition ? (
            <p className="text-foreground font-bold">{meta.competition}</p>
          ) : null}
          {meta ? <p>{meta.dateTime}</p> : null}
          {meta?.meetup ? <p>{meta.meetup}</p> : null}
          {meta?.kickoff ? <p>{meta.kickoff}</p> : null}
          {showSquad ? (
            <p>
              Squad: {matchDaySquadCount}{" "}
              {matchDaySquadCount === 1 ? "player" : "players"}
            </p>
          ) : null}
        </div>
      ) : null}

      {visibleCards.length > 0 ? (
        <ul
          className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1"
          aria-label="Cards"
        >
          {visibleCards.map((card) => (
            <li
              key={card.id}
              className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium"
            >
              <span aria-hidden="true">{CARD_TYPE_EMOJIS[card.type]}</span>
              <span className="truncate">{cardPersonLabel(card)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 overflow-hidden shadow-md ring-1",
        size === "compact" ? "rounded-2xl" : "rounded-3xl",
      )}
    >
      {href ? (
        <Link
          href={href}
          className="block rounded-[inherit] transition-opacity hover:opacity-80"
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
