export type PostcardGoalList =
  | { kind: "none" }
  | {
      kind: "full";
      rows: Array<{
        label: string;
        isPenalty: boolean;
        assistLabel: string | null;
      }>;
    }
  | {
      kind: "compact";
      rows: Array<{
        label: string;
        isPenalty: boolean;
        assistLabel: string | null;
      }>;
    }
  | {
      kind: "summary";
      text: string;
      extra: string | null;
    };

type MatchPostcardBase = {
  matchId: string;
  clubName: string;
  clubColour: string | null;
  clubIconUrl: string | null;
  teamName: string;
  seasonLabel: string;
  opponentName: string;
  dateLabel: string;
  homeAwayLabel: string;
  competitionLabel: string | null;
  homeName: string;
  awayName: string;
  caption: string;
  fileName: string;
};

export type PlayedMatchPostcardPayload = MatchPostcardBase & {
  kind: "played";
  homeScore: number;
  awayScore: number;
  scoreLabel: string;
  result: "W" | "D" | "L";
  story: string;
  goalList: PostcardGoalList;
  coachPotmLabel: string | null;
  playersPotmLabel: string | null;
  squadLines: string[];
  form: Array<"W" | "D" | "L">;
};

export type ScheduledMatchPostcardPayload = MatchPostcardBase & {
  kind: "scheduled";
  venueName: string | null;
  venueAddress: string | null;
  kickoffLabel: string;
  meetupLabel: string;
  squadLines: string[];
  form: Array<"W" | "D" | "L">;
};

export type MatchPostcardPayload =
  PlayedMatchPostcardPayload | ScheduledMatchPostcardPayload;

export type PlayerCardStats = {
  /** Competitive (non-friendly) matches in the match-day squad: W + D + L. */
  appearances: number;
  wins: number;
  draws: number;
  losses: number;
  /** Goals, assists and POTM count every played match, friendlies included. */
  goals: number;
  assists: number;
  /** Times named coach's player of the match. */
  potm: number;
};

/**
 * Everything the player card image needs. `lastName` is only set for adult
 * teams: cards of children never carry a surname.
 */
export type PlayerCardPayload = {
  playerId: string;
  teamId: string;
  clubName: string;
  clubColour: string | null;
  clubIconUrl: string | null;
  teamName: string;
  ageGroup: string;
  seasonLabel: string;
  firstName: string;
  lastName: string | null;
  shirtNumber: number | null;
  positionLabel: string | null;
  stats: PlayerCardStats;
  caption: string;
  fileName: string;
};

/** What the card artwork needs; the share caption and file name are not drawn. */
export type PlayerCardView = Omit<PlayerCardPayload, "caption" | "fileName">;

export type CoachCardStats = {
  /** Competitive (non-friendly) matches the team has played. */
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

/**
 * Everything the coach card image needs. Coaches are adults, so the card
 * always carries the full name.
 */
export type CoachCardPayload = {
  coachId: string;
  teamId: string;
  clubName: string;
  clubColour: string | null;
  clubIconUrl: string | null;
  teamName: string;
  ageGroup: string;
  seasonLabel: string;
  firstName: string;
  lastName: string | null;
  /** The coach's role on this team ("Head Coach"); "Coach" when none is set. */
  roleLabel: string;
  stats: CoachCardStats;
  caption: string;
  fileName: string;
};

/** What the card artwork needs; the share caption and file name are not drawn. */
export type CoachCardView = Omit<CoachCardPayload, "caption" | "fileName">;
