export type PostcardGoalList =
  | { kind: "none" }
  | {
      kind: "full";
      rows: Array<{
        label: string;
        detail: string | null;
        assistLabel: string | null;
      }>;
    }
  | {
      kind: "compact";
      rows: Array<{ label: string; detail: string | null }>;
    }
  | {
      kind: "summary";
      text: string;
      extra: string | null;
    };

export type MatchPostcardPayload = {
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
  homeScore: number;
  awayScore: number;
  scoreLabel: string;
  result: "W" | "D" | "L";
  story: string;
  goalList: PostcardGoalList;
  coachPotmLabel: string | null;
  playersPotmLabel: string | null;
  form: Array<"W" | "D" | "L">;
  caption: string;
  fileName: string;
};
