import { slugPostcardPart } from "@/lib/postcards/content";
import type { CoachCardStats } from "@/lib/postcards/types";

const DEFAULT_COACH_ROLE = "Coach";

/** "Head Coach" as recorded on the team; "Coach" when no role is set. */
export function coachRoleLabel(role: string | null | undefined): string {
  return role?.trim() || DEFAULT_COACH_ROLE;
}

/**
 * The numbers on a coach card: the team's competitive record. Friendlies are
 * left out, matching the player card.
 */
export function coachCardStats(
  results: ReadonlyArray<{
    result: "W" | "D" | "L";
    goalsFor: number;
    goalsAgainst: number;
    isFriendly: boolean;
  }>,
): CoachCardStats {
  const stats: CoachCardStats = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
  for (const row of results) {
    if (row.isFriendly) continue;
    stats.played += 1;
    if (row.result === "W") stats.wins += 1;
    else if (row.result === "D") stats.draws += 1;
    else stats.losses += 1;
    stats.goalsFor += row.goalsFor;
    stats.goalsAgainst += row.goalsAgainst;
  }
  return stats;
}

/** The names printed on a card. Coaches are adults, so the surname shows. */
export function coachCardNames(coach: {
  first_name: string;
  last_name: string;
}): { firstName: string; lastName: string | null } {
  const firstName = coach.first_name.trim() || "Coach";
  const lastName = coach.last_name.trim();
  return { firstName, lastName: lastName || null };
}

/** Plain-text caption shared with the image. */
export function coachCardCaption(input: {
  coach: { first_name: string; last_name: string };
  roleLabel: string;
  clubName: string;
  teamName: string;
  seasonLabel: string;
  stats: CoachCardStats;
}): string {
  const names = coachCardNames(input.coach);
  const name = [names.firstName, names.lastName].filter(Boolean).join(" ");
  const head = [name, input.roleLabel].join(" · ");
  const where = [input.clubName, input.teamName, input.seasonLabel]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
  const stats = [
    `Competitive matches: ${input.stats.played} (W${input.stats.wins} D${input.stats.draws} L${input.stats.losses})`,
    `Goals for: ${input.stats.goalsFor}`,
    `Goals against: ${input.stats.goalsAgainst}`,
  ];

  return [head, where, "", ...stats].join("\n");
}

export function coachCardFileName(input: {
  firstName: string;
  lastName: string | null;
  teamName: string;
  seasonLabel: string;
}): string {
  const coach = slugPostcardPart(
    [input.firstName, input.lastName].filter(Boolean).join(" "),
  );
  const team = slugPostcardPart(input.teamName);
  const season = slugPostcardPart(input.seasonLabel.replace(/\//g, "-"));
  return `${coach}-${team}-${season}-coach-card.png`;
}
