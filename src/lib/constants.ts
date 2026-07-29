import type {
  CompetitionKind,
  MatchStatus,
  MatchVenue,
  TeamGender,
  TeamRole,
  GuardianRelationship,
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

export const TEAM_ROLES: TeamRole[] = ["coach", "player"];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  coach: "Coach",
  guardian: "Guardian",
  player: "Player",
};

export const GUARDIAN_RELATIONSHIPS: GuardianRelationship[] = [
  "dad",
  "mum",
  "guardian",
  "football_contact",
  "other",
];

export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationship,
  string
> = {
  dad: "Dad",
  mum: "Mum",
  guardian: "Guardian",
  football_contact: "Football contact",
  other: "Other",
};

export type MatchListFilter = "upcoming" | "played" | "other" | "all";
