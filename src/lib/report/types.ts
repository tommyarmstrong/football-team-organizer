import type { CoachCardView, PlayerCardView } from "@/lib/postcards/types";
import type { CompetitionResult } from "@/lib/supabase/database.types";

/** Everything the season report renders. Plain data, no Supabase types. */
export type ReportMatch = {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  opponent: string;
  homeAway: "home" | "away" | "neutral";
  competitionId: string | null;
  /** "Friendly", the competition name, or null when there is none. */
  competitionLabel: string | null;
  isFriendly: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
};

export type ReportPlayer = {
  id: string;
  /** The player's first name, as printed everywhere in the report. */
  name: string;
  /** First name only: the report never prints a player's surname. */
  firstName: string;
  shirtNumber: number | null;
  position: string | null;
  appearances: number;
  goals: number;
  assists: number;
  /** Player of the match awards. */
  playerOfTheMatch: number;
  /**
   * Everything the player card artwork needs, drawn straight into the page.
   * Stats here are competitive only, like the shared card.
   */
  card: PlayerCardView;
};

export type ReportCompetition = {
  id: string;
  name: string;
  kindLabel: string;
  result: CompetitionResult;
  resultLabel: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type ReportMonthAward = {
  /** yyyy-mm */
  month: string;
  monthLabel: string;
  playerName: string;
  notes: string | null;
};

/** A ground the team played at this season, with what a family needs to know. */
export type ReportVenue = {
  id: string;
  name: string;
  address: string | null;
  /** "Astro, Grass"; null when not recorded. */
  surface: string | null;
  /** "Paid parking"; null when not recorded. */
  parking: string | null;
  /** "Cafe, Tuck shop"; null when none recorded. */
  foodAndDrink: string | null;
  isHome: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Best win by goal difference, e.g. "5–1 v Rose"; null if never won there. */
  biggestWin: string | null;
};

/** A member of the coaching staff, with the card shown in the gallery. */
export type ReportCoach = {
  id: string;
  name: string;
  role: string | null;
  isHead: boolean;
  card: CoachCardView;
};

export type ReportStaffMember = {
  name: string;
  role: string | null;
};

/** One bespoke markdown section. `null` means the file has not been written. */
export type ReportContentSlot = {
  /** Repo-relative path to show when the slot is empty. */
  expectedPath: string;
  markdown: string | null;
};

/**
 * Winners of the whole-season awards, written by hand in `season-awards.json`
 * (first names, like the rest of the book). `null` means no winner chosen.
 */
export type ReportSeasonAwards = {
  /** Repo-relative path of the file that holds the winners. */
  expectedPath: string;
  playerOfTheSeason: string | null;
  playersPlayer: string | null;
  mostImproved: string | null;
};

export type ReportContent = {
  coachNotes: ReportContentSlot;
  lookingAhead: ReportContentSlot;
  seasonAwards: ReportSeasonAwards;
};

export type ReportData = {
  club: {
    name: string;
    /** #RRGGBB or null (default app green is used). */
    colour: string | null;
    iconUrl: string;
  };
  team: {
    name: string;
    seasonLabel: string;
    photoUrl: string | null;
    /** "Club · Men · Adults · 1995/96". */
    summary: string;
    homeVenue: string | null;
    trainingVenue: string | null;
    /** "Mon, Wed, Fri", or "—" when none are set. */
    trainingDays: string;
  };
  staff: ReportStaffMember[];
  headCoachName: string | null;
  /** Coaches with their cards, head coach(es) first. */
  coaches: ReportCoach[];
  /** Played matches, oldest first. */
  matches: ReportMatch[];
  competitions: ReportCompetition[];
  /** Venues of played matches, most visited first. */
  venues: ReportVenue[];
  players: ReportPlayer[];
  monthAwards: ReportMonthAward[];
  content: ReportContent;
};
