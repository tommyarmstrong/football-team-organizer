import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockFromClient,
  okResult,
  errResult,
  queryChain,
} from "@/test/supabase-mock";
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
  getFormThroughMatch,
  getPeriodStartsByPlayer,
  parseTeamStatsRpc,
  getPlayerCompetitiveRecord,
} from "@/lib/data/stats";

const leagueMatch = {
  is_friendly: false,
  competition_id: "comp-league",
  competition: { id: "comp-league", kind: "league" as const },
};

const cupMatch = {
  is_friendly: false,
  competition_id: "comp-cup",
  competition: { id: "comp-cup", kind: "cup" as const },
};

describe("stats data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
  });

  it("builds form through a league or cup match, always ending with that result", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-old",
            date: "2025-09-01",
            created_at: "2025-09-01T10:00:00Z",
            goals: [{ is_opposition: false }, { is_opposition: false }],
            ...leagueMatch,
          },
          {
            id: "m-this",
            date: "2025-09-08",
            created_at: "2025-09-08T10:00:00Z",
            goals: [{ is_opposition: true }],
            ...cupMatch,
          },
          {
            id: "m-same-day-later",
            date: "2025-09-08",
            created_at: "2025-09-08T18:00:00Z",
            goals: [{ is_opposition: false }],
            ...leagueMatch,
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

  it("builds match-card form from league and cup games only", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-friendly",
            date: "2025-09-01",
            created_at: "2025-09-01T10:00:00Z",
            is_friendly: true,
            competition_id: null,
            competition: null,
            goals: [{ is_opposition: true }],
          },
          {
            id: "m-tournament",
            date: "2025-09-03",
            created_at: "2025-09-03T10:00:00Z",
            is_friendly: false,
            competition_id: "comp-tournament",
            competition: { id: "comp-tournament", kind: "tournament" },
            goals: [{ is_opposition: false }],
          },
          {
            id: "m-other",
            date: "2025-09-05",
            created_at: "2025-09-05T10:00:00Z",
            is_friendly: false,
            competition_id: "comp-other",
            competition: { id: "comp-other", kind: "other" },
            goals: [{ is_opposition: false }, { is_opposition: false }],
          },
          {
            id: "m-cup",
            date: "2025-09-07",
            created_at: "2025-09-07T10:00:00Z",
            goals: [{ is_opposition: false }, { is_opposition: true }],
            ...cupMatch,
          },
          {
            id: "m-this",
            date: "2025-09-08",
            created_at: "2025-09-08T10:00:00Z",
            goals: [{ is_opposition: false }, { is_opposition: false }],
            ...leagueMatch,
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
      "W",
    );
    expect(result.error).toBeNull();
    expect(result.form).toEqual(["D", "W"]);
  });

  it("leaves a non-league match off the match-card form", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m-league",
            date: "2025-09-01",
            created_at: "2025-09-01T10:00:00Z",
            goals: [{ is_opposition: false }, { is_opposition: false }],
            ...leagueMatch,
          },
          {
            id: "m-friendly",
            date: "2025-09-08",
            created_at: "2025-09-08T10:00:00Z",
            is_friendly: true,
            competition_id: null,
            competition: null,
            goals: [{ is_opposition: true }],
          },
        ]),
      }),
    );
    const result = await getFormThroughMatch(
      "team-1",
      {
        id: "m-friendly",
        date: "2025-09-08",
        created_at: "2025-09-08T10:00:00Z",
      },
      "L",
    );
    expect(result.form).toEqual(["W"]);
  });

  it("queries played league and cup matches for the match-card form", async () => {
    const builder = queryChain(okResult([])) as Record<string, unknown>;
    const eq = vi.fn(() => builder);
    const inFilter = vi.fn(() => builder);
    builder.eq = eq;
    builder.in = inFilter;
    createClientMock.mockResolvedValue({ from: vi.fn(() => builder) });

    await getFormThroughMatch(
      "team-1",
      {
        id: "m-this",
        date: "2025-09-08",
        created_at: "2025-09-08T10:00:00Z",
      },
      "W",
    );

    expect(eq.mock.calls).toEqual(
      expect.arrayContaining([
        ["team_id", "team-1"],
        ["status", "played"],
        ["is_friendly", false],
      ]),
    );
    expect(inFilter).toHaveBeenCalledWith("competition.kind", [
      "league",
      "cup",
    ]);
  });
});

describe("getPlayerCompetitiveRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const goal = (is_opposition: boolean) => ({ is_opposition });

  it("counts wins, draws, and losses from each match's goals", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        match_players: okResult([
          { match: { goals: [goal(false), goal(false), goal(true)] } },
          { match: [{ goals: [goal(false), goal(true)] }] },
          { match: { goals: [goal(true)] } },
          { match: { goals: [goal(false)] } },
          { match: { goals: [] } },
          { match: null },
        ]),
      }),
    );
    const result = await getPlayerCompetitiveRecord("team-1", "player-1");
    expect(result).toEqual({
      data: { wins: 2, draws: 2, losses: 1 },
      error: null,
    });
  });

  it("filters to played, non-friendly matches for the team and player", async () => {
    const builder = queryChain(okResult([])) as Record<string, unknown>;
    const eq = vi.fn(() => builder);
    builder.eq = eq;
    const from = vi.fn(() => builder);
    createClientMock.mockResolvedValue({ from });

    await getPlayerCompetitiveRecord("team-1", "player-1");

    expect(from).toHaveBeenCalledWith("match_players");
    expect(eq.mock.calls).toEqual([
      ["player_id", "player-1"],
      ["match.team_id", "team-1"],
      ["match.status", "played"],
      ["match.is_friendly", false],
    ]);
  });

  it("returns an empty record with the error when the query fails", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ match_players: errResult("boom") }),
    );
    expect(await getPlayerCompetitiveRecord("team-1", "player-1")).toEqual({
      data: { wins: 0, draws: 0, losses: 0 },
      error: "boom",
    });
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
        person_id: "person-player-1",
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
        person_id: "person-player-2",
        first_name: "Bea",
        last_name: "Bench",
        position: "MID",
        assists: 2,
        matches_played: 4,
        periods_played: 6,
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
        person_id: "person-player-1",
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
    player_of_the_month_by_player: [
      {
        player_id: "player-2",
        person_id: "person-player-2",
        first_name: "Bea",
        last_name: "Bench",
        count: 3,
      },
    ],
    matches_played_by_player: [
      {
        player_id: "player-1",
        person_id: "person-player-1",
        first_name: "Sam",
        last_name: "Striker",
        position: "FWD",
        count: 5,
        periods_played: 9,
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
      personId: "person-player-1",
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
      personId: "person-player-2",
      name: "Bea Bench",
      count: 2,
      position: "MID",
      matchesPlayed: 4,
      periodsPlayed: 6,
    });
    expect(result.assistsByPlayer[0]?.events).toHaveLength(2);

    // POTM
    expect(result.potmByPlayer).toHaveLength(1);
    expect(result.potmByPlayer[0]).toMatchObject({
      playerId: "player-1",
      personId: "person-player-1",
      name: "Sam Striker",
      count: 2,
    });
    expect(result.potmByPlayer[0]?.events).toHaveLength(2);

    expect(result.playerOfTheMonthByPlayer).toEqual([
      {
        playerId: "player-2",
        personId: "person-player-2",
        name: "Bea Bench",
        count: 3,
      },
    ]);

    // Appearances
    expect(result.matchesPlayed).toHaveLength(1);
    expect(result.matchesPlayed[0]).toMatchObject({
      playerId: "player-1",
      personId: "person-player-1",
      name: "Sam Striker",
      count: 5,
      position: "FWD",
      periodsPlayed: 9,
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
    expect(result.playerOfTheMonthByPlayer).toEqual([]);
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
    expect(result.playerOfTheMonthByPlayer).toEqual([]);
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
                  person_id: "person-p1",
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
              player_of_the_month_by_player: [
                {
                  player_id: "p2",
                  person_id: "person-p2",
                  first_name: "C",
                  last_name: "D",
                  count: "2",
                },
              ],
              matches_played_by_player: [
                {
                  player_id: "p1",
                  person_id: "person-p1",
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
    expect(result.playerOfTheMonthByPlayer[0]?.count).toBe(2);
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
                  person_id: "person-p1",
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

describe("parseTeamStatsRpc", () => {
  it("rejects results that are not objects", () => {
    expect(parseTeamStatsRpc(null)).toBeNull();
    expect(parseTeamStatsRpc("oops")).toBeNull();
    expect(parseTeamStatsRpc([])).toBeNull();
  });

  it("turns missing or malformed series into empty lists", () => {
    expect(
      parseTeamStatsRpc({ goals_by_player: "nope", results_over_time: [] }),
    ).toEqual({
      shirt_numbers: {},
      goals_by_player: [],
      assists_by_player: [],
      potm_by_player: [],
      player_of_the_month_by_player: [],
      matches_played_by_player: [],
      results_over_time: [],
    });
  });
});

describe("getAllTeamStats with an unexpected RPC result", () => {
  it("returns an error instead of throwing", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({}, { rpcResults: { get_team_stats: okResult("oops") } }),
    );
    const result = await getAllTeamStats("team-bad");
    expect(result.error).toMatch(/unexpected response/i);
    expect(result.goalsByPlayer).toEqual([]);
  });
});

describe("getPeriodStartsByPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps each player's period starts with one event per start", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_period_starts_by_player: okResult([
              {
                player_id: "player-1",
                person_id: "person-1",
                first_name: "Sam",
                last_name: "Striker",
                position: "FWD",
                count: "3",
                competitions: [
                  {
                    competitionId: "comp-1",
                    competitionKind: "league",
                    isFriendly: false,
                  },
                  {
                    competitionId: "comp-1",
                    competitionKind: "league",
                    isFriendly: false,
                  },
                  {
                    competitionId: null,
                    competitionKind: null,
                    isFriendly: true,
                  },
                ],
              },
            ]),
          },
        },
      ),
    );

    const result = await getPeriodStartsByPlayer("team-ps-1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      {
        playerId: "player-1",
        personId: "person-1",
        name: "Sam Striker",
        count: 3,
        position: "FWD",
        events: [
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
          {
            competitionId: "comp-1",
            competitionKind: "league",
            isFriendly: false,
          },
          { competitionId: null, competitionKind: null, isFriendly: true },
        ],
      },
    ]);
  });

  it("calls the RPC with the team id", async () => {
    const rpc = vi.fn().mockResolvedValue(okResult([]));
    createClientMock.mockResolvedValue({ rpc });

    await getPeriodStartsByPlayer("team-ps-2");

    expect(rpc).toHaveBeenCalledWith("get_period_starts_by_player", {
      p_team_id: "team-ps-2",
    });
  });

  it("defaults a missing position and missing competitions", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_period_starts_by_player: okResult([
              {
                player_id: "player-2",
                person_id: "person-2",
                first_name: "Bea",
                last_name: "Bench",
                count: 1,
                competitions: null,
              },
            ]),
          },
        },
      ),
    );

    const result = await getPeriodStartsByPlayer("team-ps-3");
    expect(result.data[0]).toMatchObject({ position: null, events: [] });
  });

  it("returns an empty list for a non-array result", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        { rpcResults: { get_period_starts_by_player: okResult({}) } },
      ),
    );
    expect(await getPeriodStartsByPlayer("team-ps-4")).toEqual({
      data: [],
      error: null,
    });
  });

  it("returns the error and no rows when the RPC fails", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            get_period_starts_by_player: errResult("period starts failed"),
          },
        },
      ),
    );
    expect(await getPeriodStartsByPlayer("team-ps-5")).toEqual({
      data: [],
      error: "period starts failed",
    });
  });
});
