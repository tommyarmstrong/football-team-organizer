import {
  CARD_TYPE_LABELS,
  MATCH_STATUS_LABELS,
  OPPOSITION_GOAL_LABEL,
  VENUE_FOOD_AND_DRINK_LABELS,
  VENUE_SURFACE_LABELS,
} from "@/lib/constants";
import type {
  CardType,
  CompetitionKind,
  MatchHomeAway,
  MatchStatus,
  TeamGender,
  Venue,
  VenueFoodAndDrink,
  VenueSurface,
} from "@/lib/supabase/database.types";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatMatchDate(date: string): string {
  return dateFormatter.format(parseDateOnly(date));
}

export function formatShortDate(date: string): string {
  return shortDateFormatter.format(parseDateOnly(date));
}

export function formatKickoffTime(time: string | null): string | null {
  if (!time) return null;
  // Postgres `time` may include seconds; show HH:MM
  return time.slice(0, 5);
}

export function playerDisplayName(
  player: { first_name: string; last_name: string },
  options?: { shirtNumber?: number | null },
): string {
  const name = `${player.first_name} ${player.last_name}`.trim();
  if (options?.shirtNumber != null) {
    return `#${options.shirtNumber} ${name}`;
  }
  return name;
}

export function goalScorerLabel(goal: {
  is_opposition: boolean;
  scorer: { first_name: string; last_name: string } | null;
}): string {
  if (goal.is_opposition || !goal.scorer) return OPPOSITION_GOAL_LABEL;
  return playerDisplayName(goal.scorer);
}

export function coachDisplayName(coach: {
  first_name: string;
  second_name: string;
}): string {
  return `${coach.first_name} ${coach.second_name}`.trim();
}

export function guardianDisplayName(guardian: {
  first_name: string;
  second_name: string;
}): string {
  return `${guardian.first_name} ${guardian.second_name}`.trim();
}

export function managerDisplayName(manager: {
  first_name: string;
  second_name: string;
}): string {
  return `${manager.first_name} ${manager.second_name}`.trim();
}

export function scoreFromGoals(goals: Array<{ is_opposition: boolean }>): {
  goalsFor: number;
  goalsAgainst: number;
} {
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const goal of goals) {
    if (goal.is_opposition) goalsAgainst += 1;
    else goalsFor += 1;
  }
  return { goalsFor, goalsAgainst };
}

export function formatScore(
  goalsFor: number | null,
  goalsAgainst: number | null,
): string {
  if (goalsFor == null || goalsAgainst == null) return "—";
  return `${goalsFor}–${goalsAgainst}`;
}

export function resultLetter(
  goalsFor: number | null,
  goalsAgainst: number | null,
): "W" | "D" | "L" | null {
  if (goalsFor == null || goalsAgainst == null) return null;
  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

export function labelGender(gender: TeamGender): string {
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export function labelHomeAway(homeAway: MatchHomeAway): string {
  return homeAway.charAt(0).toUpperCase() + homeAway.slice(1);
}

/** Away: opposition first; home / neutral / unknown: our team first. */
export function formatMatchVersusTitle(
  teamName: string,
  opponentName: string,
  homeAway: MatchHomeAway | null | undefined,
): string {
  if (homeAway === "away") {
    return `${opponentName} vs ${teamName}`;
  }
  return `${teamName} vs ${opponentName}`;
}

export function labelVenueSurface(surface: VenueSurface): string {
  return VENUE_SURFACE_LABELS[surface] ?? surface;
}

export function labelVenueFoodAndDrink(
  foodAndDrink: VenueFoodAndDrink,
): string {
  return VENUE_FOOD_AND_DRINK_LABELS[foodAndDrink] ?? foodAndDrink;
}

export function formatVenueFoodAndDrink(
  foodAndDrink: VenueFoodAndDrink[] | VenueFoodAndDrink | null | undefined,
): string | null {
  const values = Array.isArray(foodAndDrink)
    ? foodAndDrink
    : foodAndDrink
      ? [foodAndDrink]
      : [];
  if (values.length === 0) return null;
  return values.map(labelVenueFoodAndDrink).join(", ");
}

export function formatVenueAddress(
  venue: Pick<
    Venue,
    "address_line1" | "address_line2" | "town_city" | "postcode"
  >,
): string | null {
  const parts = [
    venue.address_line1,
    venue.address_line2,
    venue.town_city,
    venue.postcode,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function labelMatchStatus(status: MatchStatus): string {
  return MATCH_STATUS_LABELS[status] ?? status;
}

export function labelCompetitionKind(kind: CompetitionKind | null): string {
  if (!kind) return "—";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function labelCardType(type: CardType): string {
  return CARD_TYPE_LABELS[type];
}

function parseDateOnly(date: string): Date {
  // Treat YYYY-MM-DD as local calendar date
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
