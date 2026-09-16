import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getNextFixtureMock,
  getLastResultMock,
  canEditActiveMatchDayMock,
  getRecentFormMock,
  listCompetitionsMock,
  canEditActiveTeamHistoryMock,
  getTopScorersMock,
  getTopAssistsMock,
  getTopPlayersOfTheMatchMock,
  listPlayerOfTheMonthMock,
} = vi.hoisted(() => ({
  getNextFixtureMock: vi.fn(),
  getLastResultMock: vi.fn(),
  canEditActiveMatchDayMock: vi.fn(),
  getRecentFormMock: vi.fn(),
  listCompetitionsMock: vi.fn(),
  canEditActiveTeamHistoryMock: vi.fn(),
  getTopScorersMock: vi.fn(),
  getTopAssistsMock: vi.fn(),
  getTopPlayersOfTheMatchMock: vi.fn(),
  listPlayerOfTheMonthMock: vi.fn(),
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
  getRecentForm: getRecentFormMock,
  getTopScorers: getTopScorersMock,
  getTopAssists: getTopAssistsMock,
  getTopPlayersOfTheMatch: getTopPlayersOfTheMatchMock,
}));
vi.mock("@/lib/data/competitions", () => ({
  listCompetitions: listCompetitionsMock,
}));
vi.mock("@/lib/data/player-of-the-month", () => ({
  listPlayerOfTheMonth: listPlayerOfTheMonthMock,
}));

import { getDashboardData } from "@/lib/data/dashboard";

describe("getDashboardData (§5.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNextFixtureMock.mockResolvedValue({ data: null, error: null });
    getLastResultMock.mockResolvedValue({ data: null, error: null });
    canEditActiveMatchDayMock.mockResolvedValue(false);
    getRecentFormMock.mockResolvedValue({ form: [], error: null });
    listCompetitionsMock.mockResolvedValue({ data: [], error: null });
    canEditActiveTeamHistoryMock.mockResolvedValue(false);
    getTopScorersMock.mockResolvedValue({ data: [], error: null });
    getTopAssistsMock.mockResolvedValue({ data: [], error: null });
    getTopPlayersOfTheMatchMock.mockResolvedValue({ data: [], error: null });
    listPlayerOfTheMonthMock.mockResolvedValue({ data: [], error: null });
  });

  it("loads fixture, form, competition, and leaderboard data in parallel", async () => {
    const result = await getDashboardData("team-1");

    expect(getNextFixtureMock).toHaveBeenCalledOnce();
    expect(getLastResultMock).toHaveBeenCalledOnce();
    expect(getRecentFormMock).toHaveBeenCalledOnce();
    expect(listCompetitionsMock).toHaveBeenCalledWith("team-1");
    expect(getTopScorersMock).toHaveBeenCalledWith(5);
    expect(listPlayerOfTheMonthMock).toHaveBeenCalledWith("team-1", 5);
    expect(result.form).toEqual({ form: [], error: null });
    expect(result.canEditMatch).toBe(false);
  });
});
