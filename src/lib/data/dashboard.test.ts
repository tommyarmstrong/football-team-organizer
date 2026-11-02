import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getNextFixtureMock,
  getLastResultMock,
  canEditActiveMatchDayMock,
  listCompetitionsMock,
  canEditActiveTeamHistoryMock,
  listPlayerOfTheMonthMock,
  getAllTeamStatsMock,
} = vi.hoisted(() => ({
  getNextFixtureMock: vi.fn(),
  getLastResultMock: vi.fn(),
  canEditActiveMatchDayMock: vi.fn(),
  listCompetitionsMock: vi.fn(),
  canEditActiveTeamHistoryMock: vi.fn(),
  listPlayerOfTheMonthMock: vi.fn(),
  getAllTeamStatsMock: vi.fn(),
}));

vi.mock("@/lib/data/matches", () => ({
  getNextFixture: getNextFixtureMock,
  getLastResult: getLastResultMock,
}));
vi.mock("@/lib/data/team", () => ({
  canEditActiveMatchDay: canEditActiveMatchDayMock,
  canEditActiveTeamHistory: canEditActiveTeamHistoryMock,
}));
vi.mock("@/lib/data/stats", () => ({
  getAllTeamStats: getAllTeamStatsMock,
}));
vi.mock("@/lib/data/competitions", () => ({
  listCompetitions: listCompetitionsMock,
}));
vi.mock("@/lib/data/player-of-the-month", () => ({
  listPlayerOfTheMonth: listPlayerOfTheMonthMock,
}));

import { getDashboardData } from "@/lib/data/dashboard";

const league = {
  competitionId: "comp-league",
  competitionKind: "league" as const,
  isFriendly: false,
};
const friendly = {
  competitionId: null,
  competitionKind: null,
  isFriendly: true,
};

function emptyStats() {
  return {
    goalsByPlayer: [],
    assistsByPlayer: [],
    potmByPlayer: [],
    playerOfTheMonthByPlayer: [],
    matchesPlayed: [],
    resultsOverTime: [],
    form: [],
    error: null,
  };
}

describe("getDashboardData (§5.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNextFixtureMock.mockResolvedValue({ data: null, error: null });
    getLastResultMock.mockResolvedValue({ data: null, error: null });
    canEditActiveMatchDayMock.mockResolvedValue(false);
    listCompetitionsMock.mockResolvedValue({ data: [], error: null });
    canEditActiveTeamHistoryMock.mockResolvedValue(false);
    listPlayerOfTheMonthMock.mockResolvedValue({ data: [], error: null });
    getAllTeamStatsMock.mockResolvedValue(emptyStats());
  });

  it("starts every query once and returns each result", async () => {
    const data = getDashboardData("team-1");

    expect(getNextFixtureMock).toHaveBeenCalledOnce();
    expect(getLastResultMock).toHaveBeenCalledOnce();
    expect(listCompetitionsMock).toHaveBeenCalledWith("team-1");
    expect(listPlayerOfTheMonthMock).toHaveBeenCalledWith("team-1", 5);
    expect(getAllTeamStatsMock).toHaveBeenCalledOnce();
    expect(getAllTeamStatsMock).toHaveBeenCalledWith("team-1");

    expect(await data.next).toEqual({ data: null, error: null });
    expect(await data.last).toEqual({ data: null, error: null });
    expect(await data.canEditMatch).toBe(false);
    expect(await data.canEditTeam).toBe(false);
    expect((await data.stats).resultsOverTime).toEqual([]);
    expect(await data.form).toEqual({ form: [], error: null });
    expect(await data.scorers).toEqual({ data: [], error: null });
    expect(await data.assists).toEqual({ data: [], error: null });
    expect(await data.potm).toEqual({ data: [], error: null });
  });

  it("derives leaderboards and form from the stats result without extra queries", async () => {
    getAllTeamStatsMock.mockResolvedValue({
      ...emptyStats(),
      goalsByPlayer: [
        {
          playerId: "player-1",
          personId: "person-1",
          name: "Sam Striker",
          goals: 3,
          position: null,
          matchesPlayed: 0,
          periodsPlayed: 0,
          // Two league goals and a friendly: only the league goals count.
          goalCompetitions: [league, league, friendly],
        },
      ],
      assistsByPlayer: [
        {
          playerId: "player-2",
          personId: "person-2",
          name: "Bea Bench",
          count: 1,
          events: [league],
        },
      ],
      potmByPlayer: [
        {
          playerId: "player-1",
          personId: "person-1",
          name: "Sam Striker",
          count: 1,
          events: [friendly],
        },
      ],
      resultsOverTime: [
        {
          matchId: "m1",
          date: "2025-09-01",
          label: "Rivals",
          goalsFor: 2,
          goalsAgainst: 1,
          result: "W",
          competitionId: "comp-league",
          competitionKind: "league",
          competitionName: "League",
          isFriendly: false,
        },
        {
          matchId: "m2",
          date: "2025-09-08",
          label: "Friends",
          goalsFor: 0,
          goalsAgainst: 3,
          result: "L",
          competitionId: null,
          competitionKind: null,
          competitionName: "Friendly",
          isFriendly: true,
        },
      ],
    });

    const data = getDashboardData("team-1");

    expect(await data.scorers).toEqual({
      data: [
        {
          playerId: "player-1",
          personId: "person-1",
          name: "Sam Striker",
          count: 2,
        },
      ],
      error: null,
    });
    expect((await data.assists).data).toEqual([
      expect.objectContaining({ playerId: "player-2", count: 1 }),
    ]);
    // The only potm was in a friendly, so nobody leads.
    expect((await data.potm).data).toEqual([]);
    // The friendly loss is left off the league and cup form.
    expect(await data.form).toEqual({ form: ["W"], error: null });
    expect(getAllTeamStatsMock).toHaveBeenCalledOnce();
  });

  it("passes a stats error through to the derived sections", async () => {
    getAllTeamStatsMock.mockResolvedValue({
      ...emptyStats(),
      error: "rpc failed",
    });
    const data = getDashboardData("team-1");

    expect(await data.scorers).toEqual({ data: [], error: "rpc failed" });
    expect(await data.assists).toEqual({ data: [], error: "rpc failed" });
    expect(await data.potm).toEqual({ data: [], error: "rpc failed" });
    expect(await data.form).toEqual({ form: [], error: "rpc failed" });
  });

  it("does not make fast sections wait for the slowest query", async () => {
    // Competitions never resolves: sections that do not use it must still finish.
    listCompetitionsMock.mockReturnValue(new Promise(() => {}));
    const data = getDashboardData("team-1");

    await expect(data.form).resolves.toEqual({ form: [], error: null });
    await expect(data.scorers).resolves.toEqual({ data: [], error: null });
    await expect(data.next).resolves.toEqual({ data: null, error: null });
  });

  it("does not raise an unhandled rejection before a section awaits", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      getNextFixtureMock.mockRejectedValue(new Error("boom"));
      const data = getDashboardData("team-1");
      // Let the rejection settle before anything awaits it.
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(unhandled).not.toHaveBeenCalled();
      await expect(data.next).rejects.toThrow("boom");
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
