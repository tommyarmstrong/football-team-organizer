import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture } from "@/test/fixtures";

const {
  createClientMock,
  getActiveTeamMock,
  setMatchSquadMock,
  listRosterForTeamMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
  setMatchSquadMock: vi.fn(async (): Promise<{ error: string | null }> => ({
    error: null,
  })),
  listRosterForTeamMock: vi.fn(
    async (): Promise<{
      data: Array<{ id: string }>;
      error: string | null;
    }> => ({ data: [], error: null }),
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/team", () => ({
  getActiveTeam: getActiveTeamMock,
}));
vi.mock("@/lib/data/match-players", () => ({
  setMatchSquad: setMatchSquadMock,
}));
vi.mock("@/lib/data/players", () => ({
  listRosterForTeam: listRosterForTeamMock,
}));

import {
  createMatch,
  getLastResult,
  getMatch,
  getNextFixture,
  listMatches,
  normalizeMatchRow,
  updateMatch,
  deleteMatch,
} from "@/lib/data/matches";

describe("normalizeMatchRow", () => {
  it("derives scores and unwraps relation arrays", () => {
    const normalized = normalizeMatchRow({
      id: "m1",
      team_id: "t1",
      opponent_name: "Rivals",
      date: "2025-09-01",
      kickoff_time: null,
      home_away: "home",
      venue_id: "v1",
      competition_id: "c1",
      is_friendly: false,
      player_of_the_match_id: null,
      players_player_of_the_match_id: null,
      status: "played",
      notes: null,
      club_notes: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      competition: [{ id: "c1", name: "League", kind: "league" }],
      venue: { id: "v1", name: "Pitch" },
      goals: [
        { is_opposition: false },
        { is_opposition: false },
        { is_opposition: true },
      ],
    });

    expect(normalized.goals_for).toBe(2);
    expect(normalized.goals_against).toBe(1);
    expect(normalized.competition).toEqual({
      id: "c1",
      name: "League",
      kind: "league",
    });
    expect(normalized.venue).toEqual({ id: "v1", name: "Pitch" });
  });
});

describe("listMatches / getMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
  });

  it("returns an error when no team is selected", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await listMatches()).toEqual({
      data: [],
      error: "No team selected.",
    });
  });

  it("maps listed matches through normalizeMatchRow", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult([
          {
            id: "m1",
            team_id: "team-1",
            opponent_name: "Rivals",
            date: "2025-09-01",
            kickoff_time: null,
            home_away: "home",
            venue_id: null,
            competition_id: null,
            is_friendly: true,
            player_of_the_match_id: null,
            players_player_of_the_match_id: null,
            status: "scheduled",
            notes: null,
            club_notes: null,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            competition: null,
            venue: null,
            goals: [],
          },
        ]),
      }),
    );

    const result = await listMatches("upcoming");
    expect(result.error).toBeNull();
    expect(result.data[0]?.opponent_name).toBe("Rivals");
    expect(result.data[0]?.goals_for).toBe(0);
  });

  it("applies played/other/all filters and maps list errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: okResult([]) }),
    );
    expect((await listMatches("played")).error).toBeNull();
    expect((await listMatches("other")).error).toBeNull();
    expect((await listMatches("all")).error).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("list fail") }),
    );
    expect(await listMatches()).toEqual({ data: [], error: "list fail" });
  });

  it("returns null when a match is missing", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: okResult(null) }),
    );
    expect(await getMatch("missing")).toEqual({ data: null, error: null });
  });

  it("surfaces query errors from getMatch", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("db down") }),
    );
    expect(await getMatch("m1")).toEqual({ data: null, error: "db down" });
  });
});

describe("createMatch / updateMatch / deleteMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    listRosterForTeamMock.mockResolvedValue({ data: [], error: null });
    setMatchSquadMock.mockResolvedValue({ error: null });
  });

  it("requires an active team to create", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toEqual({ data: null, error: "No team selected." });
  });

  it("creates a match for the active team", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({
          id: "m-new",
          team_id: "team-1",
          opponent_name: "Rivals",
          date: "2025-09-01",
          kickoff_time: null,
          home_away: "home",
          venue_id: null,
          competition_id: null,
          is_friendly: true,
          player_of_the_match_id: null,
          players_player_of_the_match_id: null,
          status: "scheduled",
          notes: null,
          club_notes: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        }),
      }),
    );

    const result = await createMatch({
      opponent_name: "Rivals",
      date: "2025-09-01",
      kickoff_time: null,
      home_away: "home",
      venue_id: null,
      competition_id: null,
      is_friendly: true,
      notes: null,
      club_notes: null,
      status: "scheduled",
      player_of_the_match_id: null,
      players_player_of_the_match_id: null,
    });
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("m-new");
  });

  it("maps create insert, roster, and squad errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("insert fail") }),
    );
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toEqual({ data: null, error: "insert fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: okResult(null) }),
    );
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toEqual({ data: null, error: "Could not create match." });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "m-new", team_id: "team-1" }),
      }),
    );
    listRosterForTeamMock.mockResolvedValue({ data: [], error: "roster fail" });
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toEqual({ data: null, error: "roster fail" });

    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-1" }],
      error: null,
    });
    setMatchSquadMock.mockResolvedValue({ error: "squad fail" });
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toEqual({ data: null, error: "squad fail" });
  });

  it("maps update and delete load, archive, and write errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("load fail") }),
    );
    expect(await updateMatch("m1", { opponent_name: "X" })).toEqual({
      data: null,
      error: "load fail",
    });
    expect(await deleteMatch("m1")).toEqual({ error: "load fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: okResult(null) }),
    );
    expect(await updateMatch("m1", { opponent_name: "X" })).toEqual({
      data: null,
      error: "Match not found.",
    });
    expect(await deleteMatch("m1")).toEqual({ error: "Match not found." });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "m1", team_id: "team-1" }),
        teams: errResult("team fail"),
      }),
    );
    expect(await updateMatch("m1", { opponent_name: "X" })).toEqual({
      data: null,
      error: "team fail",
    });
    expect(await deleteMatch("m1")).toEqual({ error: "team fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "m1", team_id: "team-1" }),
        teams: okResult({ archived_at: "2026-05-01T00:00:00Z" }),
      }),
    );
    expect(await updateMatch("m1", { opponent_name: "X" })).toMatchObject({
      error: expect.stringMatching(/read-only/i),
    });
    expect(await deleteMatch("m1")).toMatchObject({
      error: expect.stringMatching(/read-only/i),
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [
          okResult({ id: "m1", team_id: "team-1" }),
          errResult("write fail"),
        ],
        teams: okResult({ archived_at: null }),
      }),
    );
    expect(await updateMatch("m1", { opponent_name: "X" })).toEqual({
      data: null,
      error: "write fail",
    });
    expect(await deleteMatch("m1")).toEqual({ error: "write fail" });
  });

  it("updates and deletes matches", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [
          okResult({ id: "m1", team_id: "team-1" }),
          okResult({
            id: "m1",
            team_id: "team-1",
            opponent_name: "Updated",
          }),
        ],
        teams: okResult({ archived_at: null }),
      }),
    );
    expect(await updateMatch("m1", { opponent_name: "Updated" })).toEqual({
      data: { id: "m1", team_id: "team-1", opponent_name: "Updated" },
      error: null,
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({ id: "m1", team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
      }),
    );
    expect(await deleteMatch("m1")).toEqual({ error: null });
  });

  it("surfaces a clear error when an update returns no row", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [okResult({ id: "m1", team_id: "team-1" }), okResult(null)],
        teams: okResult({ archived_at: null }),
      }),
    );
    expect(await updateMatch("m1", { status: "played" })).toMatchObject({
      data: null,
      error: expect.stringMatching(/permission/i),
    });
  });

  it("rejects writes when the team is archived", async () => {
    getActiveTeamMock.mockResolvedValue(
      teamFixture({ archived_at: "2026-05-01T00:00:00Z" }),
    );
    expect(
      await createMatch({
        opponent_name: "Rivals",
        date: "2025-09-01",
        kickoff_time: null,
        home_away: "home",
        venue_id: null,
        competition_id: null,
        is_friendly: true,
        notes: null,
        club_notes: null,
        status: "scheduled",
        player_of_the_match_id: null,
        players_player_of_the_match_id: null,
      }),
    ).toMatchObject({ error: expect.stringMatching(/read-only/i) });
  });
});

describe("getNextFixture / getLastResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
  });

  it("returns no-team errors", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await getNextFixture()).toEqual({
      data: null,
      error: "No team selected.",
    });
    expect(await getLastResult()).toEqual({
      data: null,
      error: "No team selected.",
    });
  });

  it("returns the last played result", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({
          id: "m-last",
          team_id: "team-1",
          opponent_name: "Rivals",
          date: "2025-08-01",
          kickoff_time: null,
          home_away: "away",
          venue_id: null,
          competition_id: null,
          is_friendly: true,
          player_of_the_match_id: null,
          players_player_of_the_match_id: null,
          status: "played",
          notes: null,
          club_notes: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          competition: null,
          venue: null,
          goals: [{ is_opposition: true }],
        }),
      }),
    );

    const result = await getLastResult();
    expect(result.data?.id).toBe("m-last");
    expect(result.data?.goals_against).toBe(1);
  });

  it("falls back to any scheduled fixture when none are upcoming", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [
          okResult(null),
          okResult({
            id: "m-past-scheduled",
            team_id: "team-1",
            opponent_name: "Past FC",
            date: "2020-01-01",
            kickoff_time: null,
            home_away: "home",
            venue_id: null,
            competition_id: null,
            is_friendly: true,
            player_of_the_match_id: null,
            players_player_of_the_match_id: null,
            status: "scheduled",
            notes: null,
            club_notes: null,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            competition: null,
            venue: null,
            goals: [],
          }),
        ],
      }),
    );

    const result = await getNextFixture();
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("m-past-scheduled");
  });

  it("returns null when no scheduled fixtures exist", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [okResult(null), okResult(null)],
      }),
    );
    expect(await getNextFixture()).toEqual({ data: null, error: null });
  });

  it("maps next-fixture and last-result query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("next fail") }),
    );
    expect(await getNextFixture()).toEqual({
      data: null,
      error: "next fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: [okResult(null), errResult("fallback fail")],
      }),
    );
    expect(await getNextFixture()).toEqual({
      data: null,
      error: "fallback fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        matches: okResult({
          id: "m-next",
          team_id: "team-1",
          opponent_name: "Rivals",
          date: "2099-09-01",
          kickoff_time: null,
          home_away: "home",
          venue_id: null,
          competition_id: null,
          is_friendly: true,
          player_of_the_match_id: null,
          players_player_of_the_match_id: null,
          status: "scheduled",
          notes: null,
          club_notes: null,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          competition: [],
          venue: [],
          goals: null,
        }),
      }),
    );
    expect((await getNextFixture()).data?.id).toBe("m-next");

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: errResult("last fail") }),
    );
    expect(await getLastResult()).toEqual({
      data: null,
      error: "last fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ matches: okResult(null) }),
    );
    expect(await getLastResult()).toEqual({ data: null, error: null });
  });
});
