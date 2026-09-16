import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture } from "@/test/fixtures";

const { createClientMock, getActiveTeamMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/team", () => ({
  getActiveTeam: getActiveTeamMock,
}));

import {
  getAllTeamStats,
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
  getRecentForm,
  getFormThroughMatch,
  getResultsOverTime,
  getTopAssists,
  getTopPlayersOfTheMatch,
  getTopScorers,
} from "@/lib/data/stats";

const namedPlayer = {
  id: "player-1",
  person_id: "person-1",
  person: { first_name: "Sam", last_name: "Striker" },
};

describe("stats data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
  });

  it("returns no-team errors", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await getTopScorers()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getRecentForm()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
  });

  it("ranks top scorers, assists, and potm", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          { player_id: "player-1", player: namedPlayer },
          { player_id: "player-1", player: namedPlayer },
        ]),
        team_players: okResult([{ player_id: "player-1", shirt_number: 7 }]),
      }),
    );
    const scorers = await getTopScorers();
    expect(scorers.data[0]?.goals).toBe(2);

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          { assist_player_id: "player-1", assist: namedPlayer },
        ]),
        team_players: okResult([{ player_id: "player-1", shirt_number: 7 }]),
      }),
    );
    expect((await getTopAssists()).data[0]?.count).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            player_of_the_match_id: "player-1",
            players_player_of_the_match_id: "player-1",
            coach_potm: namedPlayer,
            players_potm: namedPlayer,
          },
        ]),
        team_players: okResult([{ player_id: "player-1", shirt_number: 7 }]),
      }),
    );
    expect((await getTopPlayersOfTheMatch()).data[0]?.count).toBe(2);
  });

  it("builds goals / assists / potm / matches-played series", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: { ...namedPlayer, position: "Forward" },
            match: {
              competition_id: "comp-1",
              is_friendly: false,
              competition: { id: "comp-1", kind: "league" },
            },
          },
        ]),
        team_players: okResult([]),
        match_players: okResult([]),
        match_period_starters: okResult([]),
      }),
    );
    expect((await getGoalsByPlayerStats()).data[0]?.goals).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        team_players: okResult([]),
        match_players: okResult([]),
      }),
    );
    expect((await getAssistsByPlayerStats()).data[0]?.count).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            player_of_the_match_id: "player-1",
            players_player_of_the_match_id: null,
            coach_potm: namedPlayer,
            players_potm: null,
            competition_id: null,
            is_friendly: true,
            competition: null,
          },
        ]),
        team_players: okResult([]),
        match_players: okResult([]),
      }),
    );
    expect((await getPlayerOfTheMatchByPlayerStats()).data[0]?.count).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        match_players: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              id: "match-1",
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        team_players: okResult([]),
      }),
    );
    expect((await getMatchesPlayedByPlayerStats()).data[0]?.count).toBe(1);
  });

  it("builds results over time", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "match-1",
            date: "2025-09-01",
            opponent_name: "Rivals",
            home_away: "home",
            competition_id: null,
            is_friendly: true,
            competition: null,
            goals: [{ is_opposition: false }, { is_opposition: true }],
          },
        ]),
      }),
    );
    const results = await getResultsOverTime();
    expect(results.data[0]?.result).toBe("D");
    expect(results.form).toEqual(["D"]);
  });

  it("maps query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: errResult("fail"),
        team_players: okResult([]),
      }),
    );
    expect(await getTopScorers()).toEqual({ data: [], error: "fail" });
  });

  it("returns no-team errors for every stats query", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await getTopAssists()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getTopPlayersOfTheMatch()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getGoalsByPlayerStats()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getAssistsByPlayerStats()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getPlayerOfTheMatchByPlayerStats()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getMatchesPlayedByPlayerStats()).toMatchObject({
      error: expect.stringMatching(/no team/i),
    });
    expect(await getResultsOverTime()).toMatchObject({
      error: expect.stringMatching(/no team/i),
      form: [],
    });
  });

  it("skips missing player embeds and unwraps arrays", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          { player_id: "player-1", player: null },
          { player_id: "player-1", player: [namedPlayer] },
          {
            player_id: "player-2",
            player: {
              id: "player-2",
              person_id: "person-2",
              person: { first_name: "Bea", last_name: "Bench" },
            },
          },
        ]),
        team_players: okResult([]),
      }),
    );
    expect((await getTopScorers()).data.map((row) => row.player.id)).toEqual([
      "player-1",
      "player-2",
    ]);

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          { assist_player_id: "player-1", assist: null },
          { assist_player_id: "player-1", assist: [namedPlayer] },
          { assist_player_id: "player-1", assist: namedPlayer },
        ]),
        team_players: okResult([]),
      }),
    );
    expect((await getTopAssists()).data[0]?.count).toBe(2);

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            coach_potm: null,
            players_potm: [namedPlayer],
          },
        ]),
        team_players: okResult([]),
      }),
    );
    expect((await getTopPlayersOfTheMatch()).data[0]?.count).toBe(1);
  });

  it("maps remaining stats query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: errResult("assists fail"),
        team_players: okResult([]),
      }),
    );
    expect(await getTopAssists()).toEqual({
      data: [],
      error: "assists fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: errResult("potm fail"),
        team_players: okResult([]),
      }),
    );
    expect(await getTopPlayersOfTheMatch()).toEqual({
      data: [],
      error: "potm fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ goals: errResult("goals fail") }),
    );
    expect(await getGoalsByPlayerStats()).toEqual({
      data: [],
      error: "goals fail",
    });
    expect(await getAssistsByPlayerStats()).toEqual({
      data: [],
      error: "goals fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("potm series fail") }),
    );
    expect(await getPlayerOfTheMatchByPlayerStats()).toEqual({
      data: [],
      error: "potm series fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ match_players: errResult("played fail") }),
    );
    expect(await getMatchesPlayedByPlayerStats()).toEqual({
      data: [],
      error: "played fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("results fail") }),
    );
    expect(await getResultsOverTime()).toEqual({
      data: [],
      error: "results fail",
      form: [],
    });
  });

  it("aggregates goals by player including appearances and periods", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: null,
            match: null,
          },
          {
            player_id: "player-1",
            player: [{ ...namedPlayer, position: "FWD" }],
            match: {
              competition_id: "comp-1",
              is_friendly: false,
              competition: [{ id: "comp-1", kind: "league" }],
            },
          },
          {
            player_id: "player-1",
            player: { ...namedPlayer, position: "FWD" },
            match: {
              competition_id: "comp-1",
              is_friendly: false,
              competition: { id: "comp-1", kind: "league" },
            },
          },
          {
            player_id: "player-2",
            player: {
              id: "player-2",
              person_id: "person-2",
              person: { first_name: "Bea", last_name: "Bench" },
              position: "MID",
            },
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: okResult([{ player_id: "player-1" }]),
        match_periods: okResult([{ id: "period-1" }]),
        match_period_starters: okResult([{ player_id: "player-1" }]),
      }),
    );
    const goals = await getGoalsByPlayerStats();
    expect(goals.data[0]?.goals).toBe(2);
    expect(goals.data[0]?.matchesPlayed).toBe(1);
    expect(goals.data[0]?.periodsPlayed).toBe(1);
  });

  it("maps goals-by-player follow-up errors and empty match lists", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: errResult("matches fail"),
      }),
    );
    expect(await getGoalsByPlayerStats()).toEqual({
      data: [],
      error: "matches fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: okResult([]),
      }),
    );
    expect((await getGoalsByPlayerStats()).data[0]?.goals).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: errResult("appearances fail"),
        match_periods: okResult([]),
      }),
    );
    expect(await getGoalsByPlayerStats()).toEqual({
      data: [],
      error: "appearances fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: okResult([]),
        match_periods: errResult("periods fail"),
      }),
    );
    expect(await getGoalsByPlayerStats()).toEqual({
      data: [],
      error: "periods fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            player_id: "player-1",
            player: namedPlayer,
            match: {
              competition_id: null,
              is_friendly: true,
              competition: null,
            },
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: okResult([]),
        match_periods: okResult([{ id: "period-1" }]),
        match_period_starters: errResult("starters fail"),
      }),
    );
    expect(await getGoalsByPlayerStats()).toEqual({
      data: [],
      error: "starters fail",
    });

    createClientMock.mockResolvedValue(mockFromClient({ goals: okResult([]) }));
    expect(await getGoalsByPlayerStats()).toEqual({ data: [], error: null });
  });

  it("aggregates assists, potm, and matches-played with repeat events", async () => {
    const matchEmbed = {
      competition_id: "comp-1",
      is_friendly: false,
      competition: [{ id: "comp-1", kind: "cup" }],
    };
    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          { assist_player_id: "player-1", assist: null, match: matchEmbed },
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: matchEmbed,
          },
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: [matchEmbed],
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: okResult([{ player_id: "player-1" }]),
      }),
    );
    const assists = await getAssistsByPlayerStats();
    expect(assists.data[0]?.count).toBe(2);
    expect(assists.data[0]?.matchesPlayed).toBe(1);

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: matchEmbed,
          },
        ]),
        matches: errResult("assist matches fail"),
      }),
    );
    expect(await getAssistsByPlayerStats()).toEqual({
      data: [],
      error: "assist matches fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: matchEmbed,
          },
        ]),
        matches: okResult([{ id: "match-1" }]),
        match_players: errResult("assist appearances fail"),
      }),
    );
    expect(await getAssistsByPlayerStats()).toEqual({
      data: [],
      error: "assist appearances fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        goals: okResult([
          {
            assist_player_id: "player-1",
            assist: namedPlayer,
            match: matchEmbed,
          },
        ]),
        matches: okResult([]),
      }),
    );
    expect((await getAssistsByPlayerStats()).data[0]?.count).toBe(1);

    createClientMock.mockResolvedValue(mockFromClient({ goals: okResult([]) }));
    expect(await getAssistsByPlayerStats()).toEqual({ data: [], error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            coach_potm: null,
            competition_id: null,
            is_friendly: true,
            competition: null,
          },
          {
            coach_potm: namedPlayer,
            competition_id: null,
            is_friendly: true,
            competition: null,
          },
          {
            coach_potm: [namedPlayer],
            competition_id: null,
            is_friendly: true,
            competition: null,
          },
        ]),
      }),
    );
    expect((await getPlayerOfTheMatchByPlayerStats()).data[0]?.count).toBe(2);

    createClientMock.mockResolvedValue(
      mockFromClient({
        match_players: okResult([
          { player_id: "player-1", player: null, match: matchEmbed },
          { player_id: "player-1", player: namedPlayer, match: matchEmbed },
          {
            player_id: "player-1",
            player: [namedPlayer],
            match: [matchEmbed],
          },
        ]),
      }),
    );
    expect((await getMatchesPlayedByPlayerStats()).data[0]?.count).toBe(2);
  });

  it("builds results over time for wins, friendlies, and league names", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-win",
            date: "2025-09-01",
            opponent_name: "Rivals",
            competition_id: "comp-1",
            is_friendly: false,
            competition: [{ id: "comp-1", name: "League", kind: "league" }],
            goals: [{ is_opposition: false }, { is_opposition: false }],
          },
          {
            id: "m-friendly",
            date: "2025-09-08",
            opponent_name: "Friends",
            competition_id: null,
            is_friendly: true,
            competition: null,
            goals: { not: "an-array" },
          },
        ]),
      }),
    );
    const results = await getResultsOverTime();
    expect(results.data[0]?.result).toBe("W");
    expect(results.data[0]?.competitionName).toBe("League");
    expect(results.data[1]?.competitionName).toBe("Friendly");
    expect(results.form).toEqual(["W", "D"]);
  });

  it("builds recent form from the latest played matches", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-new",
            date: "2025-09-08",
            goals: [{ is_opposition: true }],
          },
          {
            id: "m-old",
            date: "2025-09-01",
            goals: [{ is_opposition: false }, { is_opposition: false }],
          },
        ]),
      }),
    );
    const recent = await getRecentForm();
    expect(recent.error).toBeNull();
    expect(recent.form).toEqual(["W", "L"]);
  });

  it("builds form through a specific match, always ending with that result", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-old",
            date: "2025-09-01",
            created_at: "2025-09-01T10:00:00Z",
            goals: [{ is_opposition: false }, { is_opposition: false }],
          },
          {
            id: "m-this",
            date: "2025-09-08",
            created_at: "2025-09-08T10:00:00Z",
            goals: [{ is_opposition: true }],
          },
          {
            id: "m-same-day-later",
            date: "2025-09-08",
            created_at: "2025-09-08T18:00:00Z",
            goals: [{ is_opposition: false }],
          },
        ]),
      }),
    );
    const result = await getFormThroughMatch(
      "team-1",
      {
        id: "m-this",
        date: "2025-09-08",
        created_at: "2025-09-08T10:00:00Z",
      },
      "L",
    );
    expect(result.error).toBeNull();
    expect(result.form).toEqual(["W", "L"]);
  });
});

// ---------------------------------------------------------------------------
// §5.1 + §6.4 — getAllTeamStats (composite RPC)
// ---------------------------------------------------------------------------

describe("getAllTeamStats (§5.1 + §6.4 composite RPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseRpcResult = {
    shirt_numbers: { "player-1": 7, "player-2": null },
    goals_by_player: [
      {
        player_id: "player-1",
        first_name: "Sam",
        last_name: "Striker",
        position: "Forward",
        goals: 3,
        matches_played: 5,
        periods_played: 8,
        goal_competitions: [
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
          { competitionId: null, competitionKind: null, isFriendly: true },
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
        ],
      },
    ],
    assists_by_player: [
      {
        player_id: "player-2",
        first_name: "Bea",
        last_name: "Bench",
        assists: 2,
        matches_played: 4,
        competitions: [
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
          { competitionId: null, competitionKind: null, isFriendly: true },
        ],
      },
    ],
    potm_by_player: [
      {
        player_id: "player-1",
        first_name: "Sam",
        last_name: "Striker",
        count: 2,
        competitions: [
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
          { competitionId: null, competitionKind: null, isFriendly: true },
        ],
      },
    ],
    matches_played_by_player: [
      {
        player_id: "player-1",
        first_name: "Sam",
        last_name: "Striker",
        count: 5,
        competitions: [
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
        ],
      },
    ],
    results_over_time: [
      {
        match_id: "match-1",
        date: "2025-09-01",
        opponent_name: "Rivals",
        goals_for: 2,
        goals_against: 1,
        competition_id: "comp-1",
        competition_kind: "league",
        competition_name: "Premier League",
        is_friendly: false,
      },
      {
        match_id: "match-2",
        date: "2025-09-08",
        opponent_name: "Friends",
        goals_for: 1,
        goals_against: 1,
        competition_id: null,
        competition_kind: null,
        competition_name: null,
        is_friendly: true,
      },
    ],
  };

  it("calls get_team_stats RPC and maps goals, assists, potm, appearances, and results", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        { rpcResults: { get_team_stats: okResult(baseRpcResult) } },
      ),
    );

    const result = await getAllTeamStats("team-1");

    expect(result.error).toBeNull();

    // Goals
    expect(result.goalsByPlayer).toHaveLength(1);
    expect(result.goalsByPlayer[0]).toMatchObject({
      playerId: "player-1",
      name: "Sam Striker",
      goals: 3,
      position: "Forward",
      matchesPlayed: 5,
      periodsPlayed: 8,
    });
    expect(result.goalsByPlayer[0]?.goalCompetitions).toHaveLength(3);
    expect(result.goalsByPlayer[0]?.goalCompetitions[0]).toMatchObject({
      competitionId: "comp-1",
      competitionKind: "league",
      isFriendly: false,
    });

    // Assists
    expect(result.assistsByPlayer).toHaveLength(1);
    expect(result.assistsByPlayer[0]).toMatchObject({
      playerId: "player-2",
      name: "Bea Bench",
      count: 2,
      matchesPlayed: 4,
    });
    expect(result.assistsByPlayer[0]?.events).toHaveLength(2);

    // POTM
    expect(result.potmByPlayer).toHaveLength(1);
    expect(result.potmByPlayer[0]).toMatchObject({
      playerId: "player-1",
      name: "Sam Striker",
      count: 2,
    });
    expect(result.potmByPlayer[0]?.events).toHaveLength(2);

    // Appearances
    expect(result.matchesPlayed).toHaveLength(1);
    expect(result.matchesPlayed[0]).toMatchObject({
      playerId: "player-1",
      name: "Sam Striker",
      count: 5,
    });

    // Results
    expect(result.resultsOverTime).toHaveLength(2);
    expect(result.resultsOverTime[0]).toMatchObject({
      matchId: "match-1",
      date: "2025-09-01",
      label: "Rivals",
      goalsFor: 2,
      goalsAgainst: 1,
      result: "W",
      competitionId: "comp-1",
      competitionKind: "league",
      competitionName: "Premier League",
      isFriendly: false,
    });
    expect(result.resultsOverTime[1]).toMatchObject({
      result: "D",
      competitionName: "Friendly",
      isFriendly: true,
    });
  });

  it("builds form strip from results, capped to STATS_FORM_LIMIT", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        { rpcResults: { get_team_stats: okResult(baseRpcResult) } },
      ),
    );

    const result = await getAllTeamStats("team-1");
    expect(result.form).toEqual(["W", "D"]);
  });

  it("returns empty arrays and null error for a team with no data", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_team_stats: okResult({
              shirt_numbers: {},
              goals_by_player: [],
              assists_by_player: [],
              potm_by_player: [],
              matches_played_by_player: [],
              results_over_time: [],
            }),
          },
        },
      ),
    );

    const result = await getAllTeamStats("team-1");
    expect(result.error).toBeNull();
    expect(result.goalsByPlayer).toEqual([]);
    expect(result.assistsByPlayer).toEqual([]);
    expect(result.potmByPlayer).toEqual([]);
    expect(result.matchesPlayed).toEqual([]);
    expect(result.resultsOverTime).toEqual([]);
    expect(result.form).toEqual([]);
  });

  it("returns error when RPC fails", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        { rpcResults: { get_team_stats: errResult("stats rpc failed") } },
      ),
    );

    const result = await getAllTeamStats("team-1");
    expect(result.error).toBe("stats rpc failed");
    expect(result.goalsByPlayer).toEqual([]);
    expect(result.resultsOverTime).toEqual([]);
    expect(result.form).toEqual([]);
  });

  it("converts Postgres numeric strings to JS numbers", async () => {
    // Postgres may return aggregated counts as strings in some drivers
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_team_stats: okResult({
              shirt_numbers: {},
              goals_by_player: [
                {
                  player_id: "p1",
                  first_name: "A",
                  last_name: "B",
                  position: null,
                  goals: "5",
                  matches_played: "10",
                  periods_played: "15",
                  goal_competitions: [],
                },
              ],
              assists_by_player: [],
              potm_by_player: [],
              matches_played_by_player: [
                {
                  player_id: "p1",
                  first_name: "A",
                  last_name: "B",
                  count: "10",
                  competitions: [],
                },
              ],
              results_over_time: [
                {
                  match_id: "m1",
                  date: "2025-09-01",
                  opponent_name: "X",
                  goals_for: "3",
                  goals_against: "1",
                  competition_id: null,
                  competition_kind: null,
                  competition_name: null,
                  is_friendly: false,
                },
              ],
            }),
          },
        },
      ),
    );

    const result = await getAllTeamStats("team-1");
    expect(result.goalsByPlayer[0]?.goals).toBe(5);
    expect(result.goalsByPlayer[0]?.matchesPlayed).toBe(10);
    expect(result.goalsByPlayer[0]?.periodsPlayed).toBe(15);
    expect(result.matchesPlayed[0]?.count).toBe(10);
    expect(result.resultsOverTime[0]?.goalsFor).toBe(3);
    expect(result.resultsOverTime[0]?.goalsAgainst).toBe(1);
  });

  it("omits results with no W/D/L outcome (e.g. both sides 0 but is a draw that has no result letter)", async () => {
    // A match that resultLetter returns null for is excluded from form/results
    // (This shouldn't happen with real data but we guard against it)
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_team_stats: okResult({
              shirt_numbers: {},
              goals_by_player: [],
              assists_by_player: [],
              potm_by_player: [],
              matches_played_by_player: [],
              results_over_time: [
                {
                  match_id: "m1",
                  date: "2025-09-01",
                  opponent_name: "X",
                  goals_for: 0,
                  goals_against: 0,
                  competition_id: null,
                  competition_kind: null,
                  competition_name: null,
                  is_friendly: false,
                },
              ],
            }),
          },
        },
      ),
    );

    const result = await getAllTeamStats("team-1");
    // 0-0 is a draw — resultLetter returns "D"
    expect(result.resultsOverTime).toHaveLength(1);
    expect(result.resultsOverTime[0]?.result).toBe("D");
    expect(result.form).toEqual(["D"]);
  });

  it("handles null goal_competitions arrays gracefully", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_team_stats: okResult({
              shirt_numbers: {},
              goals_by_player: [
                {
                  player_id: "p1",
                  first_name: "A",
                  last_name: "B",
                  position: null,
                  goals: 1,
                  matches_played: 1,
                  periods_played: 0,
                  goal_competitions: null,
                },
              ],
              assists_by_player: [],
              potm_by_player: [],
              matches_played_by_player: [],
              results_over_time: [],
            }),
          },
        },
      ),
    );

    const result = await getAllTeamStats("team-1");
    expect(result.goalsByPlayer[0]?.goalCompetitions).toEqual([]);
  });
});
