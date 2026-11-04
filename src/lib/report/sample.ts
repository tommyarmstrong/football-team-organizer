import type {
  ReportCompetition,
  ReportContent,
  ReportData,
  ReportMatch,
  ReportPlayer,
} from "@/lib/report/types";
import { buildReportCompetitions } from "@/lib/report/build";

/**
 * A fabricated season for designing the report without a database. None of
 * these people exist. Used by `/team/report/sample` and the unit tests.
 */

type MatchSeed = [
  date: string,
  opponent: string,
  homeAway: ReportMatch["homeAway"],
  competition: "league" | "cup" | "friendly",
  goalsFor: number,
  goalsAgainst: number,
];

const MATCH_SEEDS: MatchSeed[] = [
  ["2025-09-06", "Oakfield Colts", "home", "friendly", 4, 1],
  ["2025-09-13", "Westbridge Juniors", "away", "league", 2, 2],
  ["2025-09-20", "Hillside Hornets", "home", "league", 3, 0],
  ["2025-09-27", "Marsh Lane Rovers", "away", "league", 1, 2],
  ["2025-10-04", "Kingsford United", "home", "league", 5, 1],
  ["2025-10-11", "Brook Green Athletic", "away", "league", 0, 0],
  ["2025-10-18", "Oakfield Colts", "home", "league", 2, 1],
  ["2025-10-25", "Northgate Youth", "away", "cup", 3, 1],
  ["2025-11-08", "Westbridge Juniors", "home", "league", 4, 2],
  ["2025-11-15", "Hillside Hornets", "away", "league", 2, 0],
  ["2025-11-22", "Kingsford United", "away", "cup", 1, 1],
  ["2025-11-29", "Marsh Lane Rovers", "home", "league", 3, 3],
  ["2025-12-06", "Brook Green Athletic", "home", "league", 6, 0],
  ["2026-01-17", "Northgate Youth", "home", "league", 1, 0],
  ["2026-01-24", "Oakfield Colts", "away", "league", 2, 3],
  ["2026-02-07", "Westbridge Juniors", "away", "league", 3, 1],
  ["2026-02-21", "Hillside Hornets", "home", "cup", 2, 0],
  ["2026-02-28", "Kingsford United", "home", "league", 0, 1],
  ["2026-03-07", "Marsh Lane Rovers", "away", "league", 4, 0],
  ["2026-03-14", "Brook Green Athletic", "away", "league", 2, 2],
  ["2026-03-28", "Northgate Youth", "away", "cup", 5, 2],
  ["2026-04-11", "Oakfield Colts", "home", "league", 3, 0],
  ["2026-04-25", "Westbridge Juniors", "home", "friendly", 2, 2],
];

export const SAMPLE_COMPETITIONS = [
  {
    id: "sample-league",
    name: "Riverside Junior League U10",
    display_name: "Junior League",
    kind: "league",
    result: "runner_up",
  },
  {
    id: "sample-cup",
    name: "County Youth Cup U10",
    display_name: "County Cup",
    kind: "cup",
    result: "semi_final",
  },
] as const;

function result(f: number, a: number): ReportMatch["result"] {
  return f > a ? "W" : f < a ? "L" : "D";
}

export function sampleMatches(): ReportMatch[] {
  return MATCH_SEEDS.map(
    ([date, opponent, homeAway, competition, goalsFor, goalsAgainst], i) => ({
      id: `sample-match-${i + 1}`,
      date,
      opponent,
      homeAway,
      competitionId:
        competition === "league"
          ? "sample-league"
          : competition === "cup"
            ? "sample-cup"
            : null,
      competitionLabel:
        competition === "league"
          ? "Junior League"
          : competition === "cup"
            ? "County Cup"
            : "Friendly",
      isFriendly: competition === "friendly",
      goalsFor,
      goalsAgainst,
      result: result(goalsFor, goalsAgainst),
    }),
  );
}

type PlayerSeed = [
  name: string,
  shirt: number | null,
  position: string,
  apps: number,
  goals: number,
  assists: number,
  potm: number,
];

const PLAYER_SEEDS: PlayerSeed[] = [
  ["Alfie Harper", 1, "GK", 21, 0, 0, 3],
  ["Ben Okafor", 2, "DEF", 22, 1, 3, 1],
  ["Charlie Wren", 3, "DEF", 19, 0, 2, 0],
  ["Dev Patel", 4, "DEF", 20, 2, 1, 2],
  ["Ellis Marlow", 5, "DEF", 17, 1, 0, 0],
  ["Finn Gallagher", 6, "MID", 22, 4, 9, 4],
  ["George Nwosu", 7, "WNG", 21, 9, 6, 3],
  ["Harry Lindqvist", 8, "MID", 18, 3, 4, 1],
  ["Isaac Moreau", 9, "FWD", 22, 18, 5, 5],
  ["Jack Thornton", 10, "MID", 20, 6, 8, 2],
  ["Kai Brennan", 11, "WNG", 19, 7, 3, 1],
  ["Leo Castellanos", 12, "DEF", 14, 0, 0, 0],
  ["Max Ashworth", 13, "FWD", 16, 8, 1, 0],
  ["Noah Fitzgerald-Okonkwo", 14, "MID", 12, 1, 2, 0],
  ["Oscar Bell", 15, "GK", 9, 0, 0, 1],
  ["Theo Kowalski", null, "MID", 5, 0, 0, 0],
];

export function samplePlayers(): ReportPlayer[] {
  return PLAYER_SEEDS.map(
    ([name, shirtNumber, position, appearances, goals, assists, potm], i) => ({
      id: `sample-player-${i + 1}`,
      name,
      shirtNumber,
      position,
      appearances,
      goals,
      assists,
      playerOfTheMatch: potm,
    }),
  );
}

function sampleCompetitions(matches: ReportMatch[]): ReportCompetition[] {
  return buildReportCompetitions(
    SAMPLE_COMPETITIONS.map((c) => ({
      ...c,
      age_group: "U10",
      created_at: "",
      format: "league",
      gender: null,
      minutes_per_period: null,
      notes: null,
      organizer: null,
      periods: "2",
      players_per_team: 7,
      season: "2025/26",
      team_id: "sample-team",
      venue_id: null,
      venue_mode: "fixed",
      date: null,
      meetup_time: null,
      home_away: null,
    })),
    matches,
  );
}

export function sampleReportData(
  content: ReportContent,
  options: {
    colour?: string | null;
    withPhoto?: boolean;
    /** A brand-new team: no matches, players, staff or awards. */
    empty?: boolean;
  } = {},
): ReportData {
  const matches = options.empty ? [] : sampleMatches();
  const data: ReportData = {
    club: {
      name: "Riverside Rangers FC",
      colour: options.colour === undefined ? "#1D3A8A" : options.colour,
      iconUrl: "/football-icon.svg",
    },
    team: {
      name: "Rangers U10 Lions",
      seasonLabel: "2025/26",
      photoUrl: options.withPhoto ? "/player-card-photo.jpg" : null,
    },
    staff: [
      { name: "Sam Whitfield", role: "Head Coach" },
      { name: "Priya Raman", role: "Assistant Coach" },
      { name: "Dan Mercer", role: "Goalkeeping Coach" },
    ],
    headCoachName: "Sam Whitfield",
    matches,
    competitions: sampleCompetitions(matches),
    players: samplePlayers(),
    monthAwards: [
      {
        month: "2025-09",
        monthLabel: "September 2025",
        playerName: "Finn Gallagher",
        notes: "Ran the midfield from day one and never stopped talking.",
      },
      {
        month: "2025-10",
        monthLabel: "October 2025",
        playerName: "Isaac Moreau",
        notes: "Nine goals in five games.",
      },
      {
        month: "2025-11",
        monthLabel: "November 2025",
        playerName: "Alfie Harper",
        notes: null,
      },
      {
        month: "2026-02",
        monthLabel: "February 2026",
        playerName: "George Nwosu",
        notes: "Two-footed, fearless, and hugely improved on the left.",
      },
    ],
    content,
  };

  if (!options.empty) return data;
  return {
    ...data,
    staff: [],
    headCoachName: null,
    players: [],
    monthAwards: [],
    competitions: [],
  };
}
