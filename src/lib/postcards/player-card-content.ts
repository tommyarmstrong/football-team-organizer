import {
  postcardPlayerLabel,
  postcardShowsSurname,
  slugPostcardPart,
} from "@/lib/postcards/content";
import { sortTeamsForDisplay } from "@/lib/team/season";
import type { PlayerCardStats } from "@/lib/postcards/types";
import type { Team, TeamGender } from "@/lib/supabase/database.types";

const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  WNG: "Winger",
  FWD: "Forward",
};

/** One entry per goal / assist / award; friendlies are left out of the card. */
function countCompetitive(
  events: ReadonlyArray<{ isFriendly: boolean }> | undefined,
): number {
  return (events ?? []).filter((event) => !event.isFriendly).length;
}

/**
 * The numbers on a player card: the competitive record plus competitive
 * goals, assists and player-of-the-match awards. Shared by the card route and
 * the season report so the two always agree.
 */
export function playerCardStats(input: {
  record: { wins: number; draws: number; losses: number };
  goalEvents?: ReadonlyArray<{ isFriendly: boolean }>;
  assistEvents?: ReadonlyArray<{ isFriendly: boolean }>;
  potmEvents?: ReadonlyArray<{ isFriendly: boolean }>;
}): PlayerCardStats {
  const { wins, draws, losses } = input.record;
  return {
    appearances: wins + draws + losses,
    wins,
    draws,
    losses,
    goals: countCompetitive(input.goalEvents),
    assists: countCompetitive(input.assistEvents),
    potm: countCompetitive(input.potmEvents),
  };
}

/** "FWD" -> "Forward". Unknown free-text positions are shown as recorded. */
export function playerPositionLabel(
  position: string | null | undefined,
): string | null {
  const trimmed = position?.trim() ?? "";
  if (!trimmed) return null;
  return POSITION_LABELS[trimmed.toUpperCase()] ?? trimmed;
}

/**
 * The names printed on a card. Children get a first name only; adult teams
 * (men / women) also print the surname, matching the match postcard rules.
 */
export function playerCardNames(
  player: { first_name: string; last_name: string },
  gender: TeamGender,
): { firstName: string; lastName: string | null } {
  const firstName = player.first_name.trim() || "Player";
  const lastName = player.last_name.trim();
  if (postcardShowsSurname(gender) && lastName) {
    return { firstName, lastName };
  }
  return { firstName, lastName: null };
}

/** Plain-text caption shared with the image. Same privacy rules as the card. */
export function playerCardCaption(input: {
  player: { first_name: string; last_name: string };
  gender: TeamGender;
  shirtNumber: number | null;
  clubName: string;
  teamName: string;
  seasonLabel: string;
  positionLabel: string | null;
  stats: PlayerCardStats;
}): string {
  const label = postcardPlayerLabel(
    {
      firstName: input.player.first_name,
      lastName: input.player.last_name,
      shirtNumber: input.shirtNumber,
    },
    { gender: input.gender },
  );
  const head = [label, input.positionLabel].filter(Boolean).join(" · ");
  const where = [input.clubName, input.teamName, input.seasonLabel]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
  const stats = [
    `Competitive apps: ${input.stats.appearances} (W${input.stats.wins} D${input.stats.draws} L${input.stats.losses})`,
    `Goals: ${input.stats.goals}`,
    `Assists: ${input.stats.assists}`,
    `POTM: ${input.stats.potm}`,
  ];

  return [head, where, "", ...stats].join("\n");
}

export function playerCardFileName(input: {
  firstName: string;
  teamName: string;
  seasonLabel: string;
}): string {
  const player = slugPostcardPart(input.firstName);
  const team = slugPostcardPart(input.teamName);
  const season = slugPostcardPart(input.seasonLabel.replace(/\//g, "-"));
  return `${player}-${team}-${season}-player-card.png`;
}

/**
 * Chooses which of a person's teams a card is for. An explicit request wins
 * (and yields null when it is not one of `teams`), then the viewer's active
 * team, then a preferred (currently active) team, then the first team in
 * display order (current seasons before archived ones).
 */
export function pickCardTeam(
  teams: Team[],
  options: {
    requestedTeamId?: string | null;
    activeTeamId?: string | null;
    preferredTeamIds?: readonly string[];
  } = {},
): Team | null {
  if (teams.length === 0) return null;
  if (options.requestedTeamId) {
    return teams.find((team) => team.id === options.requestedTeamId) ?? null;
  }
  if (options.activeTeamId) {
    const active = teams.find((team) => team.id === options.activeTeamId);
    if (active) return active;
  }
  const ordered = sortTeamsForDisplay(teams);
  const preferred = new Set(options.preferredTeamIds ?? []);
  return ordered.find((team) => preferred.has(team.id)) ?? ordered[0] ?? null;
}

export const pickPlayerCardTeam = pickCardTeam;
