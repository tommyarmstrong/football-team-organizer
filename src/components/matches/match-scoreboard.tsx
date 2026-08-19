import { cn } from "@/lib/utils";
import {
  formatHomeFirstScore,
  formatMatchVersusTitle,
  labelHomeAway,
  resultLetter,
} from "@/lib/format";
import type { MatchHomeAway, MatchStatus } from "@/lib/supabase/database.types";

export function MatchScoreboard({
  teamName,
  opponentName,
  homeAway,
  status,
  goalsFor,
  goalsAgainst,
  compact = false,
}: {
  teamName: string;
  opponentName: string;
  homeAway: MatchHomeAway | null | undefined;
  status: MatchStatus;
  goalsFor: number;
  goalsAgainst: number;
  compact?: boolean;
}) {
  const isAway = homeAway === "away";
  const homeName = isAway ? opponentName : teamName;
  const awayName = isAway ? teamName : opponentName;
  const showScore = status === "played" || status === "in_progress";
  const result = showScore ? resultLetter(goalsFor, goalsAgainst) : null;
  const score = formatHomeFirstScore(goalsFor, goalsAgainst, homeAway);
  const versus = formatMatchVersusTitle(teamName, opponentName, homeAway);

  return (
    <div
      className={cn("min-w-0", compact ? "space-y-1" : "space-y-2")}
      aria-label={showScore ? `${versus}, ${score}` : versus}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span
          className={cn(
            "truncate text-right font-semibold",
            compact ? "text-sm" : "text-base",
          )}
        >
          {homeName}
        </span>
        {showScore ? (
          <span
            className={cn(
              "font-display rounded-xl px-2.5 py-1 text-center leading-none tracking-tight tabular-nums",
              compact ? "text-2xl" : "text-3xl",
              result === "W" && "bg-win/12 text-win",
              result === "D" && "bg-draw/20 text-draw-foreground",
              result === "L" && "bg-loss/12 text-loss",
            )}
          >
            {score}
          </span>
        ) : (
          <span className="text-muted-foreground px-2 text-xs font-bold tracking-[0.2em] uppercase">
            vs
          </span>
        )}
        <span
          className={cn(
            "truncate font-semibold",
            compact ? "text-sm" : "text-base",
          )}
        >
          {awayName}
        </span>
      </div>
      {homeAway ? (
        <span className="text-muted-foreground block text-center text-[11px] font-medium tracking-wide uppercase">
          {labelHomeAway(homeAway)}
        </span>
      ) : null}
    </div>
  );
}
