import type {
  CardType,
  CoachObjectiveStatus,
  CoachObjectiveType,
  CompetitionKind,
  MatchHomeAway,
  MatchStatus,
  PlayerObjectiveStatus,
  PlayerObjectiveType,
  TeamGender,
  TeamRole,
  GuardianRelationship,
  VenueFoodAndDrink,
  VenueSurface,
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

export const MATCH_HOME_AWAYS: MatchHomeAway[] = ["home", "away", "neutral"];

export const VENUE_SURFACES: VenueSurface[] = [
  "astro",
  "grass",
  "indoor",
  "varies",
  "unknown",
];

export const VENUE_SURFACE_LABELS: Record<VenueSurface, string> = {
  astro: "Astro",
  grass: "Grass",
  indoor: "Indoor",
  varies: "Varies",
  unknown: "Unknown",
};

export const VENUE_FOOD_AND_DRINKS: VenueFoodAndDrink[] = [
  "bbq",
  "cafe",
  "tuck_shop",
  "local_outlets",
  "ice_cream_van",
];

export const VENUE_FOOD_AND_DRINK_LABELS: Record<VenueFoodAndDrink, string> = {
  bbq: "BBQ",
  cafe: "Cafe",
  tuck_shop: "Tuck shop",
  local_outlets: "Local outlets",
  ice_cream_van: "Ice cream van",
};

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

export const CARD_TYPE_EMOJIS: Record<CardType, string> = {
  yellow_1st: "🟨",
  yellow_2nd: "🟨🟨",
  red: "🟥",
  timeout: "⏳",
  other: "⚠️",
};

export type MatchListFilter = "upcoming" | "played" | "other" | "all";

export const MATCH_PERIOD_NAMES = [
  "Quarter 1",
  "Quarter 2",
  "Quarter 3",
  "Quarter 4",
  "Half 1",
  "Half 2",
  "Single period match",
  "Extra time 1",
  "Extra time 2",
  "Penalty Shootout",
] as const;

export type MatchPeriodName = (typeof MATCH_PERIOD_NAMES)[number];

/** Auto sort ranks: quarters, then halves, then single, then ET, penalty last. */
export const MATCH_PERIOD_SORT_ORDER: Record<MatchPeriodName, number> = {
  "Quarter 1": 10,
  "Quarter 2": 20,
  "Quarter 3": 30,
  "Quarter 4": 40,
  "Half 1": 50,
  "Half 2": 60,
  "Single period match": 70,
  "Extra time 1": 80,
  "Extra time 2": 90,
  "Penalty Shootout": 100,
};

export function isMatchPeriodName(value: string): value is MatchPeriodName {
  return (MATCH_PERIOD_NAMES as readonly string[]).includes(value);
}

export function matchPeriodSortOrder(name: string): number {
  if (isMatchPeriodName(name)) return MATCH_PERIOD_SORT_ORDER[name];
  return 999;
}

/** Statuses that allow goals, cards, and player-of-the-match fields. */
export function matchAllowsEvents(status: MatchStatus): boolean {
  return status === "played" || status === "in_progress";
}

/** Form value for recording a goal scored by the opposition. */
export const OPPOSITION_SCORER_VALUE = "__opposition__";

export const OPPOSITION_GOAL_LABEL = "Opponent Goal";

export const COACH_OBJECTIVE_TYPES: CoachObjectiveType[] = [
  "coaching",
  "communications",
  "time_management",
  "admin",
  "other",
];

export const COACH_OBJECTIVE_TYPE_LABELS: Record<CoachObjectiveType, string> = {
  coaching: "Coaching",
  communications: "Communications",
  time_management: "Time Management",
  admin: "Admin",
  other: "Other",
};

export const COACH_OBJECTIVE_STATUSES: CoachObjectiveStatus[] = [
  "in_progress",
  "ready_for_review",
  "complete",
  "deferred",
];

export const COACH_OBJECTIVE_STATUS_LABELS: Record<
  CoachObjectiveStatus,
  string
> = {
  in_progress: "In Progress",
  ready_for_review: "Ready for Review",
  complete: "Complete",
  deferred: "Deferred",
};

export const PLAYER_OBJECTIVE_TYPES: PlayerObjectiveType[] = [
  "skills",
  "confidence",
  "team_work",
  "positional",
  "following_coaching",
  "other",
];

export const PLAYER_OBJECTIVE_TYPE_LABELS: Record<PlayerObjectiveType, string> =
  {
    skills: "Skills",
    confidence: "Confidence",
    team_work: "Team work",
    positional: "Positional",
    following_coaching: "Following coaching",
    other: "Other",
  };

export const PLAYER_OBJECTIVE_STATUSES: PlayerObjectiveStatus[] = [
  "emerging",
  "expected",
  "exceeding",
  "complete",
];

export const PLAYER_OBJECTIVE_STATUS_LABELS: Record<
  PlayerObjectiveStatus,
  string
> = {
  emerging: "Emerging",
  expected: "Expected",
  exceeding: "Exceeding",
  complete: "Complete",
};
