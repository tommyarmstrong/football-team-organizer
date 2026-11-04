import { describe, expect, it } from "vitest";
import {
  buildReportCompetitions,
  buildReportData,
  buildReportMatches,
  buildReportPlayers,
} from "@/lib/report/build";
import type { MatchWithRelations } from "@/lib/data/matches";
import type { RosterPlayer } from "@/lib/data/players";
import type { Competition } from "@/lib/supabase/database.types";

function dbMatch(
  id: string,
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    id,
    competition_id: null,
    created_at: "2025-09-01T10:00:00Z",
    date: "2025-09-06",
    is_friendly: false,
    kickoff_time: null,
    meetup_time: null,
    notes: null,
    club_notes: null,
    opponent_name: `Opp ${id}`,
    player_of_the_match_id: null,
    players_player_of_the_match_id: null,
    status: "played",
    stage: null,
    team_id: "t1",
    updated_at: "2025-09-01T10:00:00Z",
    home_away: "home",
    venue_id: null,
    competition: null,
    venue: null,
    goals_for: 1,
    goals_against: 0,
    ...overrides,
  };
}

function roster(id: string, extra: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    id,
    person_id: `person-${id}`,
    team_player_id: `tp-${id}`,
    first_name: id,
    last_name: "Smith",
    position: null,
    shirt_number: null,
    active: true,
    ...extra,
  };
}

describe("buildReportMatches", () => {
  it("keeps only played matches, oldest first, with a result", () => {
    const rows = [
      dbMatch("late", { date: "2025-10-01", goals_for: 0, goals_against: 2 }),
      dbMatch("scheduled", { status: "scheduled" }),
      dbMatch("early", { date: "2025-09-01", goals_for: 2, goals_against: 2 }),
      dbMatch("cancelled", { status: "cancelled" }),
    ];
    const result = buildReportMatches(rows);
    expect(result.map((m) => m.id)).toEqual(["early", "late"]);
    expect(result.map((m) => m.result)).toEqual(["D", "L"]);
  });

  it("orders same-day matches by creation time", () => {
    const rows = [
      dbMatch("b", { created_at: "2025-09-01T12:00:00Z" }),
      dbMatch("a", { created_at: "2025-09-01T09:00:00Z" }),
    ];
    expect(buildReportMatches(rows).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("labels friendlies and competition fixtures", () => {
    const [friendly, league] = buildReportMatches([
      dbMatch("f", { is_friendly: true, date: "2025-09-01" }),
      dbMatch("l", {
        date: "2025-09-02",
        competition_id: "c1",
        competition: {
          id: "c1",
          name: "Official League Name",
          display_name: "Junior League",
          kind: "league",
        },
      }),
    ]);
    expect(friendly!.competitionLabel).toBe("Friendly");
    expect(league!.competitionLabel).toBe("Junior League");
    expect(league!.competitionId).toBe("c1");
  });
});

describe("buildReportPlayers", () => {
  const stats = {
    goalsByPlayer: [
      {
        playerId: "a",
        personId: "pa",
        name: "a",
        goals: 4,
        position: null,
        matchesPlayed: 3,
        periodsPlayed: 6,
        goalCompetitions: [],
      },
    ],
    assistsByPlayer: [{ playerId: "a", personId: "pa", name: "a", count: 2 }],
    potmByPlayer: [{ playerId: "b", personId: "pb", name: "b", count: 1 }],
    matchesPlayed: [
      { playerId: "a", personId: "pa", name: "a", count: 3 },
      { playerId: "c", personId: "pc", name: "c", count: 2 },
    ],
  };

  it("merges the season lines onto the roster", () => {
    const players = buildReportPlayers({
      roster: [roster("a", { shirt_number: 9 }), roster("b")],
      ...stats,
    });
    const a = players.find((p) => p.id === "a")!;
    expect(a).toMatchObject({
      name: "a Smith",
      shirtNumber: 9,
      goals: 4,
      assists: 2,
      appearances: 3,
      playerOfTheMatch: 0,
    });
    expect(players.find((p) => p.id === "b")!.playerOfTheMatch).toBe(1);
  });

  it("keeps inactive players only when they played", () => {
    const players = buildReportPlayers({
      roster: [
        roster("a"),
        roster("b", { active: false }),
        roster("c", { active: false }),
      ],
      ...stats,
    });
    expect(players.map((p) => p.id)).toEqual(["a", "c"]);
  });
});

describe("buildReportCompetitions", () => {
  const competition = (id: string, extra: Partial<Competition> = {}) =>
    ({
      id,
      name: `Comp ${id}`,
      display_name: null,
      kind: "league",
      result: "none",
      ...extra,
    }) as Competition;

  it("records the team's results in each competition", () => {
    const matches = buildReportMatches([
      dbMatch("1", { competition_id: "c1", goals_for: 3, goals_against: 1 }),
      dbMatch("2", { competition_id: "c1", goals_for: 0, goals_against: 0 }),
      dbMatch("3", { competition_id: "c2", goals_for: 0, goals_against: 1 }),
    ]);
    const result = buildReportCompetitions(
      [competition("c1", { result: "champions" }), competition("c2")],
      matches,
    );
    expect(result[0]).toMatchObject({
      id: "c1",
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      resultLabel: "Champions",
    });
    expect(result[1]).toMatchObject({ id: "c2", played: 1, losses: 1 });
  });

  it("drops competitions with no matches and no outcome", () => {
    const result = buildReportCompetitions(
      [competition("empty"), competition("done", { result: "completed" })],
      [],
    );
    expect(result.map((c) => c.id)).toEqual(["done"]);
  });

  it("prefers the display name", () => {
    const [result] = buildReportCompetitions(
      [competition("c1", { display_name: "Shown", result: "completed" })],
      [],
    );
    expect(result!.name).toBe("Shown");
  });
});

describe("buildReportData", () => {
  it("assembles the report with the head coach and sorted awards", () => {
    const data = buildReportData({
      club: { name: "Club", colour: "#112233", icon_url: null },
      team: {
        name: "U10 Lions",
        display_name: "Lions",
        season_label: "2025/26",
        photo_url: null,
      },
      matches: [dbMatch("m1")],
      roster: [roster("a")],
      goalsByPlayer: [],
      assistsByPlayer: [],
      potmByPlayer: [],
      matchesPlayed: [],
      coaches: [
        {
          team_coach_id: "1",
          coach_id: "c1",
          person_id: "p1",
          name: "Ann Assistant",
          role: "Assistant Coach",
        },
        {
          team_coach_id: "2",
          coach_id: "c2",
          person_id: "p2",
          name: "Hal Head",
          role: "Head Coach",
        },
      ],
      competitions: [],
      monthAwards: [
        {
          id: "2",
          team_id: "t1",
          player_id: "a",
          month: "2025-11",
          notes: "  ",
          created_at: "",
          updated_at: "",
          player: {
            id: "a",
            person_id: "pa",
            first_name: "Al",
            last_name: "Lee",
          },
        },
        {
          id: "1",
          team_id: "t1",
          player_id: "a",
          month: "2025-09",
          notes: "Great",
          created_at: "",
          updated_at: "",
          player: {
            id: "a",
            person_id: "pa",
            first_name: "Al",
            last_name: "Lee",
          },
        },
      ],
      content: {
        coachNotes: { expectedPath: "x", markdown: null },
        lookingAhead: { expectedPath: "y", markdown: null },
      },
    });

    expect(data.team.name).toBe("Lions");
    expect(data.club.iconUrl).toBe("/football-icon.svg");
    expect(data.headCoachName).toBe("Hal Head");
    expect(data.staff).toHaveLength(2);
    expect(data.monthAwards.map((a) => a.month)).toEqual([
      "2025-09",
      "2025-11",
    ]);
    expect(data.monthAwards[0]).toMatchObject({
      playerName: "Al Lee",
      monthLabel: "September 2025",
      notes: "Great",
    });
    expect(data.monthAwards[1]!.notes).toBeNull();
  });
});
