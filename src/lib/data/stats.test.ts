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
  getAssistsByPlayerStats,
  getGoalsByPlayerStats,
  getMatchesPlayedByPlayerStats,
  getPlayerOfTheMatchByPlayerStats,
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
});
