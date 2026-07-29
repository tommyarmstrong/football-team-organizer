import type {
  CardType,
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

export const AGE_GROUPS = [
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "U15",
  "U16",
  "Adults",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export const TRAINING_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type TrainingDay = (typeof TRAINING_DAYS)[number];

export const TRAINING_DAY_LABELS: Record<TrainingDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const COACH_TEAM_ROLES = [
  "Head Coach",
  "Assistant Coach",
  "Sporting Director",
  "Head of Year",
  "Head of Boys",
  "Head of Girls",
] as const;

export type CoachTeamRole = (typeof COACH_TEAM_ROLES)[number];

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
  "in_progress",
  "played",
  "postponed",
  "cancelled",
];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  played: "Played",
  postponed: "Postponed",
  cancelled: "Cancelled",
};

export const PLAYER_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

export const TEAM_ROLES: TeamRole[] = [
  "management",
  "coach",
  "guardian",
  "guardian_assistant",
  "player",
];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  management: "Management",
  coach: "Coach",
  guardian: "Guardian",
  guardian_assistant: "Guardian assistant",
  player: "Player",
};

export const GUARDIAN_RELATIONSHIPS: GuardianRelationship[] = [
  "parent",
  "guardian",
  "football_contact",
  "other",
];

export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationship,
  string
> = {
  parent: "Parent",
  guardian: "Guardian",
  football_contact: "Football contact",
  other: "Other",
};

export const CARD_TYPES: CardType[] = [
  "yellow_1st",
  "yellow_2nd",
  "red",
  "timeout",
  "other",
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  yellow_1st: "Yellow card (1st)",
  yellow_2nd: "Yellow card (2nd)",
  red: "Red card",
  timeout: "Timeout",
  other: "Other",
};

export const CARD_PERSON_KINDS = ["player", "coach", "guardian"] as const;

export type CardPersonKind = (typeof CARD_PERSON_KINDS)[number];

export const CARD_PERSON_KIND_LABELS: Record<CardPersonKind, string> = {
  player: "Player",
  coach: "Coach",
  guardian: "Guardian",
};

export type MatchListFilter = "upcoming" | "played" | "other" | "all";

/** Statuses that allow score, goals, cards, and player-of-the-match fields. */
export function matchAllowsEvents(status: MatchStatus): boolean {
  return status === "played" || status === "in_progress";
}
