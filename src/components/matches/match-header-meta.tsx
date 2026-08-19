import { CARD_TYPE_EMOJIS } from "@/lib/constants";
import type { CardWithPerson } from "@/lib/data/cards";
import type { GoalWithPlayers } from "@/lib/data/goals";
import {
  coachDisplayName,
  goalScorerLabel,
  guardianDisplayName,
  labelMatchStatus,
  matchSummaryLines,
  playerDisplayName,
} from "@/lib/format";
import type { CardType, MatchStatus } from "@/lib/supabase/database.types";

export function LiveIndicator() {
  return (
    <span
      className="relative inline-flex shrink-0 animate-[live-throb_1.6s_ease-in-out_infinite] items-center rounded-full border border-red-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-red-600 uppercase dark:border-red-400 dark:text-red-400"
      aria-label="Live — in progress"
      title="In progress"
    >
      LIVE
    </span>
  );
}

function cardPersonLabel(card: CardWithPerson): string {
  if (card.player) return playerDisplayName(card.player);
  if (card.coach) return coachDisplayName(card.coach);
  if (card.guardian) return guardianDisplayName(card.guardian);
  return "Unknown";
}

function cardChipClassName(type: CardType): string {
  switch (type) {
    case "yellow_1st":
      return "border-yellow-500 text-yellow-800 dark:text-yellow-200";
    case "yellow_2nd":
      return "border-red-500 text-red-800 dark:text-red-200";
    case "red":
      return "border-red-600 text-red-800 dark:text-red-200";
    default:
      return "border-border text-foreground";
  }
}

const chipBaseClassName =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";

export function MatchHeaderMeta({
  date,
  kickoffTime,
  venueName,
  competitionName,
  status,
  matchDaySquadCount,
  goals,
  cards,
}: {
  date: string;
  kickoffTime: string | null;
  venueName: string | null;
  competitionName?: string | null;
  status: MatchStatus;
  matchDaySquadCount: number;
  goals: GoalWithPlayers[];
  cards: CardWithPerson[];
}) {
  const meta = matchSummaryLines({
    competitionName,
    date,
    kickoffTime,
    venueName: venueName ?? "Unknown",
  });

  const showCancelledOrPostponed =
    status === "cancelled" || status === "postponed";
  const showMatchExtras = !showCancelledOrPostponed;

  const ourGoals = showMatchExtras
    ? goals.filter((goal) => !goal.is_opposition)
    : [];
  const visibleCards = showMatchExtras ? cards : [];

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {meta.competition ? (
          <p className="font-bold">{meta.competition}</p>
        ) : null}
        <p>{meta.dateTime}</p>
        {meta.venue ? <p>{meta.venue}</p> : null}
        {showCancelledOrPostponed ? (
          <p className="text-destructive font-medium">
            {labelMatchStatus(status)}
          </p>
        ) : null}
        {showMatchExtras ? <p>Match day squad: {matchDaySquadCount}</p> : null}
      </div>

      {ourGoals.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Goal scorers">
          {ourGoals.map((goal) => (
            <li
              key={goal.id}
              className={`${chipBaseClassName} border-green-600 text-green-800 dark:text-green-200`}
            >
              <span aria-hidden="true">⚽</span>
              <span className="truncate">{goalScorerLabel(goal)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {visibleCards.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Cards">
          {visibleCards.map((card) => (
            <li
              key={card.id}
              className={`${chipBaseClassName} ${cardChipClassName(card.type)}`}
            >
              <span aria-hidden="true">{CARD_TYPE_EMOJIS[card.type]}</span>
              <span className="truncate">{cardPersonLabel(card)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
