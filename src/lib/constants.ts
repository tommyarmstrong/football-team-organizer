import type {
  CardType,
  CoachObjectiveStatus,
  CoachObjectiveType,
  CompetitionGender,
  CompetitionKind,
  CompetitionPeriods,
  CompetitionResult,
  MatchHomeAway,
  MatchStatus,
  PlayerObjectiveStatus,
  PlayerObjectiveType,
  TeamGender,
  TeamRole,
  GuardianRelationship,
  VenueFoodAndDrink,
  VenueParking,
  VenueSurface,
} from "@/lib/supabase/database.types";

export const APP_NAME = "Football Team Organizer";

export const APP_DESCRIPTION =
  "Record fixtures, results, players, and goals for your youth football team.";

/** Default glossy football shown when a club has no uploaded icon. */
export const DEFAULT_CLUB_ICON_SRC = "/football-icon.svg";

export const CLUB_ICONS_BUCKET = "club-icons";

export const TEAM_PHOTOS_BUCKET = "team-photos";

export const TEAM_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const TEAM_PHOTO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Selectable team genders in forms. Legacy `mixed` remains in the DB enum. */
export const TEAM_GENDERS: TeamGender[] = ["boys", "girls", "men", "women"];

/** Display labels for team gender enum values (including legacy `mixed`). */
export const TEAM_GENDER_LABELS: Record<TeamGender, string> = {
  boys: "Boys",
  girls: "Girls",
  men: "Men",
  women: "Women",
  mixed: "Mixed",
};

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
  "tournament",
  "other",
];

/** Form/select value for a friendly fixture (not a competitions row). */
export const FRIENDLY_COMPETITION_VALUE = "__friendly__";

export const COMPETITION_GENDERS: CompetitionGender[] = [
  "female",
  "male",
  "mixed",
];

export const COMPETITION_GENDER_LABELS: Record<CompetitionGender, string> = {
  female: "Female",
  male: "Male",
  mixed: "Mixed",
};

/** Period count options; `2` is halves (default). */
export const COMPETITION_PERIODS: CompetitionPeriods[] = [
  "1",
  "2",
  "4",
  "other",
];

export const COMPETITION_PERIOD_LABELS: Record<CompetitionPeriods, string> = {
  "1": "1",
  "2": "2 (Halves)",
  "4": "4 (Quarters)",
  other: "Other",
};

export const DEFAULT_COMPETITION_PERIODS: CompetitionPeriods = "2";

/** Default period count when creating a match with no competition selected. */
export const DEFAULT_MATCH_PERIODS: CompetitionPeriods = "4";

export const COMPETITION_RESULTS: CompetitionResult[] = [
  "champions",
  "runner_up",
  "third_place",
  "semi_final",
  "knock_outs",
  "group_stage",
  "promoted",
  "relegated",
  "completed",
  "cancelled",
  "none",
  "ongoing",
];

export const COMPETITION_RESULT_LABELS: Record<CompetitionResult, string> = {
  champions: "Champions",
  runner_up: "Runner up",
  third_place: "Third place",
  semi_final: "Semi-final",
  knock_outs: "Knock-outs",
  group_stage: "Group stage",
  promoted: "Promoted",
  relegated: "Relegated",
  completed: "Completed",
  cancelled: "Cancelled",
  none: "None",
  ongoing: "Ongoing",
};

/** Competition venue field values that are not a configured venue id. */
export const COMPETITION_VENUE_SPECIAL = ["unknown", "multiple"] as const;
export type CompetitionVenueSpecial =
  (typeof COMPETITION_VENUE_SPECIAL)[number];

export const COMPETITION_VENUE_SPECIAL_LABELS: Record<
  CompetitionVenueSpecial,
  string
> = {
  unknown: "Unknown",
  multiple: "Multiple",
};

/** Recent form boxes shown on the Stats page. */
export const STATS_FORM_LIMIT = 8;

export const DEFAULT_COMPETITION_RESULT: CompetitionResult = "ongoing";

export const MATCH_HOME_AWAYS: MatchHomeAway[] = ["home", "away", "neutral"];

export const VENUE_SURFACES: VenueSurface[] = [
  "astro",
  "grass",
  "hard_court",
  "indoor",
  "varies",
  "unknown",
];

export const VENUE_SURFACE_LABELS: Record<VenueSurface, string> = {
  astro: "Astro",
  grass: "Grass",
  hard_court: "Hard Court",
  indoor: "Indoor",
  varies: "Varies",
  unknown: "Unknown",
};

export const VENUE_PARKINGS: VenueParking[] = [
  "usually_fine",
  "weekend_parking",
  "paid_parking",
  "no_parking",
  "unknown",
];

export const VENUE_PARKING_LABELS: Record<VenueParking, string> = {
  usually_fine: "Usually fine",
  weekend_parking: "Weekend parking",
  paid_parking: "Paid parking",
  no_parking: "No Parking",
  unknown: "Unknown",
};

export const VENUE_PARKING_EMOJI = "🚗";

export const VENUE_FOOD_AND_DRINKS: VenueFoodAndDrink[] = [
  "bbq",
  "cafe",
  "tuck_shop",
  "local_outlets",
  "ice_cream_van",
  "bar",
  "toilets",
  "rain_shelter",
];

export const VENUE_FOOD_AND_DRINK_LABELS: Record<VenueFoodAndDrink, string> = {
  bbq: "BBQ",
  cafe: "Cafe",
  tuck_shop: "Tuck shop",
  local_outlets: "Local outlets",
  ice_cream_van: "Ice cream van",
  bar: "Bar",
  toilets: "Toilets",
  rain_shelter: "Rain shelter",
};

export const VENUE_FOOD_AND_DRINK_EMOJIS: Record<VenueFoodAndDrink, string> = {
  bbq: "🍔",
  cafe: "☕",
  tuck_shop: "🍬",
  local_outlets: "🛍️",
  ice_cream_van: "🍦",
  bar: "🍸",
  toilets: "🚻",
  rain_shelter: "☂️",
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
  football_contact: "Responsible adult",
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
  "First half",
  "Second half",
  "Single period match",
  "Extra time 1",
  "Extra time 2",
  "Penalty Shootout",
] as const;

export type MatchPeriodName = (typeof MATCH_PERIOD_NAMES)[number];

/** Periods that can be added after kick-off; regulation periods come from the fixture. */
export const EXTRA_TIME_OR_PENALTY_PERIOD_NAMES = [
  "Extra time 1",
  "Extra time 2",
  "Penalty Shootout",
] as const satisfies readonly MatchPeriodName[];

export type ExtraTimeOrPenaltyPeriodName =
  (typeof EXTRA_TIME_OR_PENALTY_PERIOD_NAMES)[number];

export function isExtraTimeOrPenaltyPeriodName(
  value: string,
): value is ExtraTimeOrPenaltyPeriodName {
  return (EXTRA_TIME_OR_PENALTY_PERIOD_NAMES as readonly string[]).includes(
    value,
  );
}

/** Extra time / penalty names not already used on the match. */
export function availableExtraTimeOrPenaltyPeriodNames(
  existingNames: readonly string[],
): ExtraTimeOrPenaltyPeriodName[] {
  const used = new Set(existingNames);
  return EXTRA_TIME_OR_PENALTY_PERIOD_NAMES.filter((name) => !used.has(name));
}

/** Auto sort ranks: quarters, then halves, then single, then ET, penalty last. */
export const MATCH_PERIOD_SORT_ORDER: Record<MatchPeriodName, number> = {
  "Quarter 1": 10,
  "Quarter 2": 20,
  "Quarter 3": 30,
  "Quarter 4": 40,
  "First half": 50,
  "Second half": 60,
  "Single period match": 70,
  "Extra time 1": 80,
  "Extra time 2": 90,
  "Penalty Shootout": 100,
};

export function isMatchPeriodName(value: string): value is MatchPeriodName {
  return (MATCH_PERIOD_NAMES as readonly string[]).includes(value);
}

export function isCompetitionPeriods(
  value: string,
): value is CompetitionPeriods {
  return (COMPETITION_PERIODS as readonly string[]).includes(value);
}

/** Named periods created for a match from a competition-style period count. */
export function periodNamesForCompetitionPeriods(
  periods: CompetitionPeriods,
): MatchPeriodName[] {
  switch (periods) {
    case "1":
      return ["Single period match"];
    case "2":
      return ["First half", "Second half"];
    case "4":
      return ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
    case "other":
      return [];
  }
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

export const OPPOSITION_GOAL_LABEL = "Goal against";

/** Form value for an opposition own goal credited to our team. */
export const OWN_GOAL_SCORER_VALUE = "__own_goal__";

export const OWN_GOAL_LABEL = "Own Goal";

/** Mutually exclusive goal type flags (penalty / free kick / set piece). */
export const GOAL_KIND_VALUES = [
  "none",
  "penalty",
  "freekick",
  "setpiece",
] as const;

export type GoalKindValue = (typeof GOAL_KIND_VALUES)[number];

export const GOAL_KIND_LABELS: Record<GoalKindValue, string> = {
  none: "Open Play",
  penalty: "Penalty",
  freekick: "Direct Free Kick",
  setpiece: "Set Piece",
};

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
