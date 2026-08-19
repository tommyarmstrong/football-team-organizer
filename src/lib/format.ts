import {
  CARD_TYPE_LABELS,
  COACH_OBJECTIVE_STATUS_LABELS,
  COACH_OBJECTIVE_TYPE_LABELS,
  COMPETITION_GENDER_LABELS,
  COMPETITION_PERIOD_LABELS,
  COMPETITION_RESULT_LABELS,
  GOAL_KIND_LABELS,
  MATCH_STATUS_LABELS,
  OPPOSITION_GOAL_LABEL,
  OWN_GOAL_LABEL,
  PLAYER_OBJECTIVE_STATUS_LABELS,
  PLAYER_OBJECTIVE_TYPE_LABELS,
  TEAM_GENDER_LABELS,
  TRAINING_DAY_LABELS,
  type TrainingDay,
  VENUE_FOOD_AND_DRINK_LABELS,
  VENUE_SURFACE_LABELS,
} from "@/lib/constants";
import type {
  CardType,
  CoachObjectiveStatus,
  CoachObjectiveType,
  CompetitionGender,
  CompetitionKind,
  CompetitionPeriods,
  CompetitionResult,
  MatchHomeAway,
  MatchStatus,
  PlayerObjectiveStatus,
  PlayerObjectiveType,
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

/** Age in completed years and months (rounded down), e.g. "10 years, 4 months". */
export function formatAge(dateOfBirth: string, now: Date = new Date()): string {
  const birth = parseDateOnly(dateOfBirth);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    return "0 months";
  }

  const yearPart = years === 1 ? "1 year" : `${years} years`;
  const monthPart = months === 1 ? "1 month" : `${months} months`;

  if (years === 0) return monthPart;
  if (months === 0) return yearPart;
  return `${yearPart}, ${monthPart}`;
}

export function formatKickoffTime(time: string | null): string | null {
  if (!time) return null;
  // Postgres `time` may include seconds; show HH:MM
  return time.slice(0, 5);
}

/** Date and kickoff on one line, e.g. "Sun 15 Mar 2026 · 14:30". */
export function formatMatchDateTime(
  date: string,
  kickoffTime: string | null,
): string {
  return [formatMatchDate(date), formatKickoffTime(kickoffTime)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Shared match summary lines used on the matches list, match page, and
 * dashboard: competition, then date and time, then venue — each optional
 * except date/time.
 */
export function matchSummaryLines(match: {
  competitionName?: string | null;
  date: string;
  kickoffTime: string | null;
  venueName?: string | null;
}): {
  competition: string | null;
  dateTime: string;
  venue: string | null;
} {
  const competition = match.competitionName?.trim() || null;
  const venue = match.venueName?.trim() || null;
  return {
    competition,
    dateTime: formatMatchDateTime(match.date, match.kickoffTime),
    venue,
  };
}

export function playerDisplayName(
  player: { first_name: string; last_name: string },
  options?: { shirtNumber?: number | null },
): string {
  const name = `${player.first_name} ${player.last_name}`.trim();
  if (options?.shirtNumber != null) {
    return `${options.shirtNumber} ${name}`;
  }
  return name;
}

export function goalScorerLabel(goal: {
  is_opposition: boolean;
  is_own_goal?: boolean;
  scorer: { first_name: string; last_name: string } | null;
}): string {
  if (goal.is_own_goal) return OWN_GOAL_LABEL;
  if (goal.is_opposition || !goal.scorer) return OPPOSITION_GOAL_LABEL;
  return playerDisplayName(goal.scorer);
}

export function goalKindLabel(goal: {
  is_penalty: boolean;
  is_freekick: boolean;
  from_setpiece: boolean;
}): string | null {
  if (goal.is_penalty) return `(${GOAL_KIND_LABELS.penalty})`;
  if (goal.is_freekick) return `(${GOAL_KIND_LABELS.freekick})`;
  if (goal.from_setpiece) return `(${GOAL_KIND_LABELS.setpiece})`;
  return null;
}

export function formatGoalMinute(
  minute: number | null | undefined,
): string | null {
  if (minute == null) return null;
  return `'${minute}`;
}

export function coachDisplayName(coach: {
  first_name: string;
  second_name?: string;
  last_name?: string;
}): string {
  const last = coach.second_name ?? coach.last_name ?? "";
  return `${coach.first_name} ${last}`.trim();
}

export function guardianDisplayName(guardian: {
  first_name: string;
  second_name?: string;
  last_name?: string;
}): string {
  const last = guardian.second_name ?? guardian.last_name ?? "";
  return `${guardian.first_name} ${last}`.trim();
}

export function managerDisplayName(manager: {
  first_name: string;
  second_name?: string;
  last_name?: string;
}): string {
  const last = manager.second_name ?? manager.last_name ?? "";
  return `${manager.first_name} ${last}`.trim();
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

/** Score with the home side first (away fixtures swap our for/against). */
export function formatHomeFirstScore(
  goalsFor: number | null,
  goalsAgainst: number | null,
  homeAway: MatchHomeAway | null | undefined,
): string {
  if (homeAway === "away") {
    return formatScore(goalsAgainst, goalsFor);
  }
  return formatScore(goalsFor, goalsAgainst);
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
  return TEAM_GENDER_LABELS[gender];
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

/**
 * Played / in progress: "Home 4-2 Away".
 * Otherwise the versus title (e.g. "Home vs Away").
 */
export function formatMatchTitle(
  teamName: string,
  opponentName: string,
  homeAway: MatchHomeAway | null | undefined,
  status: MatchStatus,
  goalsFor: number,
  goalsAgainst: number,
): string {
  if (status !== "played" && status !== "in_progress") {
    return formatMatchVersusTitle(teamName, opponentName, homeAway);
  }

  const homeGoals = homeAway === "away" ? goalsAgainst : goalsFor;
  const awayGoals = homeAway === "away" ? goalsFor : goalsAgainst;
  const homeName = homeAway === "away" ? opponentName : teamName;
  const awayName = homeAway === "away" ? teamName : opponentName;
  return `${homeName} ${homeGoals}-${awayGoals} ${awayName}`;
}

export function labelVenueSurface(surface: VenueSurface): string {
  return VENUE_SURFACE_LABELS[surface] ?? surface;
}

export function formatVenueSurface(
  surface: VenueSurface[] | VenueSurface | null | undefined,
): string | null {
  const values = Array.isArray(surface) ? surface : surface ? [surface] : [];
  if (values.length === 0) return null;
  return values.map(labelVenueSurface).join(", ");
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

export function labelCompetitionGender(
  gender: CompetitionGender | null,
): string {
  if (!gender) return "—";
  return COMPETITION_GENDER_LABELS[gender];
}

export function labelCompetitionPeriods(
  periods: CompetitionPeriods | null,
): string {
  if (!periods) return "—";
  return COMPETITION_PERIOD_LABELS[periods];
}

export function labelCompetitionResult(
  result: CompetitionResult | null | undefined,
): string {
  if (!result) return "—";
  return COMPETITION_RESULT_LABELS[result];
}

/** Prefer team display_name when set; otherwise the official team name. */
export function teamDisplayName(team: {
  name: string;
  display_name?: string | null;
}): string {
  const display = team.display_name?.trim();
  return display || team.name;
}

/** Club, gender, age group, and season for the team page header. */
export function formatTeamHeaderSummary({
  clubName,
  gender,
  ageGroup,
  seasonLabel,
  archived = false,
}: {
  clubName: string;
  gender: TeamGender;
  ageGroup: string;
  seasonLabel: string;
  archived?: boolean;
}): string {
  const summary = [clubName, labelGender(gender), ageGroup, seasonLabel]
    .filter(Boolean)
    .join(" · ");
  return archived ? `${summary} · Archived` : summary;
}

export function formatTrainingDays(days: string[] | null): string {
  if (!days || days.length === 0) return "—";
  return days.map((d) => TRAINING_DAY_LABELS[d as TrainingDay] ?? d).join(", ");
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatAwardMonth(month: string): string {
  const [year, monthPart] = month.split("-");
  if (!year || !monthPart) return month;
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function labelCardType(type: CardType): string {
  return CARD_TYPE_LABELS[type];
}

export function labelCoachObjectiveType(type: CoachObjectiveType): string {
  return COACH_OBJECTIVE_TYPE_LABELS[type];
}

export function labelCoachObjectiveStatus(
  status: CoachObjectiveStatus,
): string {
  return COACH_OBJECTIVE_STATUS_LABELS[status];
}

export function labelPlayerObjectiveType(type: PlayerObjectiveType): string {
  return PLAYER_OBJECTIVE_TYPE_LABELS[type];
}

export function labelPlayerObjectiveStatus(
  status: PlayerObjectiveStatus,
): string {
  return PLAYER_OBJECTIVE_STATUS_LABELS[status];
}

function parseDateOnly(date: string): Date {
  // Treat YYYY-MM-DD as local calendar date
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
