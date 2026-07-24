import type {
  CompetitionKind,
  MatchStatus,
  MatchVenue,
  TeamGender,
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

export function coachDisplayName(coach: {
  first_name: string;
  second_name: string;
}): string {
  return `${coach.first_name} ${coach.second_name}`.trim();
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

export function labelVenue(venue: MatchVenue): string {
  return venue.charAt(0).toUpperCase() + venue.slice(1);
}

export function labelMatchStatus(status: MatchStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function labelCompetitionKind(kind: CompetitionKind | null): string {
  if (!kind) return "—";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function parseDateOnly(date: string): Date {
  // Treat YYYY-MM-DD as local calendar date
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
