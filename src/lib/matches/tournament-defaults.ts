import {
  DEFAULT_MATCH_STAGE,
  MATCH_HOME_AWAYS,
  MATCH_STAGES,
} from "@/lib/constants";
import type {
  Competition,
  CompetitionKind,
  CompetitionPeriods,
  MatchHomeAway,
  MatchStage,
} from "@/lib/supabase/database.types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export type MatchScheduleFields = {
  date: string;
  meetup_time: string | null;
  home_away: MatchHomeAway;
  venue_id: string | null;
  periods: CompetitionPeriods;
};

export function competitionIsTournament(
  kind: CompetitionKind | null | undefined,
): boolean {
  return kind === "tournament";
}

export function competitionHasMatchStage(
  kind: CompetitionKind | null | undefined,
): boolean {
  return kind === "tournament" || kind === "cup";
}

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function tournamentScheduleFromForm(input: {
  kind: CompetitionKind;
  date: string;
  meetupTime: string;
  homeAway: string;
}):
  | {
      date: string | null;
      meetup_time: string | null;
      home_away: MatchHomeAway | null;
    }
  | { error: string } {
  if (!competitionIsTournament(input.kind)) {
    return { date: null, meetup_time: null, home_away: null };
  }

  let date: string | null = null;
  if (input.date) {
    if (!DATE_RE.test(input.date) || !isRealDate(input.date)) {
      return { error: "Date must be a valid date." };
    }
    date = input.date;
  }

  let meetup_time: string | null = null;
  if (input.meetupTime) {
    if (!TIME_RE.test(input.meetupTime)) {
      return { error: "Meet-up must be a time." };
    }
    meetup_time = input.meetupTime;
  }

  let home_away: MatchHomeAway | null = null;
  if (input.homeAway) {
    if (!MATCH_HOME_AWAYS.includes(input.homeAway as MatchHomeAway)) {
      return { error: "Invalid home/away value." };
    }
    home_away = input.homeAway as MatchHomeAway;
  }

  return { date, meetup_time, home_away };
}

/**
 * Copy shared tournament details onto a match. A blank tournament field leaves
 * the match value in place. Venue "multiple" stays per match.
 */
export function applyTournamentMatchFields<T extends MatchScheduleFields>(
  fields: T,
  competition: Pick<
    Competition,
    | "kind"
    | "date"
    | "meetup_time"
    | "home_away"
    | "venue_mode"
    | "venue_id"
    | "periods"
  > | null,
): T {
  if (!competition || !competitionIsTournament(competition.kind)) return fields;

  let venue_id = fields.venue_id;
  if (competition.venue_mode === "venue") {
    venue_id = competition.venue_id;
  } else if (competition.venue_mode === "unknown") {
    venue_id = null;
  }

  return {
    ...fields,
    date: competition.date || fields.date,
    meetup_time: competition.meetup_time ?? fields.meetup_time,
    home_away: competition.home_away ?? fields.home_away,
    venue_id,
    periods: competition.periods,
  };
}

export function resolveMatchStage(
  raw: string,
  kind: CompetitionKind | null | undefined,
): { stage: MatchStage | null } | { error: string } {
  if (!competitionHasMatchStage(kind)) return { stage: null };
  if (!raw) return { stage: DEFAULT_MATCH_STAGE };
  if (!MATCH_STAGES.includes(raw as MatchStage)) {
    return { error: "Invalid stage." };
  }
  return { stage: raw as MatchStage };
}
