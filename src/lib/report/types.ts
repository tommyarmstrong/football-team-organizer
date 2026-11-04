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
  /** Links the player to /people/<personId>; needed for the card URL. */
  personId: string;
  name: string;
  /** Placeholder cards show first names only, like cards of children. */
  firstName: string;
  shirtNumber: number | null;
  position: string | null;
  appearances: number;
  goals: number;
  assists: number;
  /** Player of the match awards. */
  playerOfTheMatch: number;
  /** Player card image URL, or null when no card can be rendered. */
  cardUrl: string | null;
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

export type ReportContent = {
  coachNotes: ReportContentSlot;
  lookingAhead: ReportContentSlot;
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
  };
  staff: ReportStaffMember[];
  headCoachName: string | null;
  /** Played matches, oldest first. */
  matches: ReportMatch[];
  competitions: ReportCompetition[];
  players: ReportPlayer[];
  monthAwards: ReportMonthAward[];
  content: ReportContent;
};
