import type {
  CompetitionKind,
  MatchStatus,
  MatchVenue,
  TeamGender,
} from "@/lib/supabase/database.types";

export const APP_NAME = "Football Team Organizer";

export const APP_DESCRIPTION =
  "Record fixtures, results, players, and goals for your youth football team.";

export const TEAM_GENDERS: TeamGender[] = ["boys", "girls", "mixed"];

export const COMPETITION_KINDS: CompetitionKind[] = [
  "league",
  "cup",
  "friendly",
  "tournament",
  "other",
];

export const MATCH_VENUES: MatchVenue[] = ["home", "away", "neutral"];

export const MATCH_STATUSES: MatchStatus[] = [
  "scheduled",
  "played",
  "postponed",
  "cancelled",
];

export const PLAYER_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

export type MatchListFilter = "upcoming" | "played" | "other" | "all";
