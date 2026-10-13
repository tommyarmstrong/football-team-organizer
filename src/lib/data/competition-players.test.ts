import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult } from "@/test/supabase-mock";

const { createClientMock, listRosterForTeamMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  listRosterForTeamMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/players", () => ({
  listRosterForTeam: listRosterForTeamMock,
}));

import {
  ensureTournamentSquad,
  initialMatchSquadPlayerIds,
  listCompetitionPlayers,
  seedDefaultTournamentSquad,
  setCompetitionSquad,
} from "@/lib/data/competition-players";

describe("competition players", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRosterForTeamMock.mockResolvedValue({ data: [], error: null });
  });

  it("lists tournament squad players", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        competition_players: okResult([
          { id: "cp-1", competition_id: "comp-1", player_id: "player-1" },
        ]),
      }),
    );
    const result = await listCompetitionPlayers("comp-1");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("adds and removes tournament squad members", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
        competition_players: [
          okResult([{ id: "cp-old", player_id: "player-1" }]),
          okResult([{ id: "cp-old" }]),
          okResult([{ id: "cp-new" }]),
        ],
      }),
    );

    const result = await setCompetitionSquad("comp-1", [
      "player-2",
      "player-2",
    ]);
    expect(result.error).toBeNull();
  });

  it("reports when RLS silently blocks squad removals", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
        competition_players: [
          okResult([{ id: "cp-old", player_id: "player-1" }]),
          okResult([]),
        ],
      }),
    );

    const result = await setCompetitionSquad("comp-1", []);
    expect(result.error).toMatch(/permission/i);
  });

  it("seeds a tournament with the active team squad", async () => {
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-1" }, { id: "player-2" }],
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
        competition_players: [
          okResult([]),
          okResult([{ id: "cp-1" }, { id: "cp-2" }]),
        ],
      }),
    );

    const result = await seedDefaultTournamentSquad("comp-1", "team-1");
    expect(result.error).toBeNull();
    expect(listRosterForTeamMock).toHaveBeenCalledWith("team-1");
  });

  it("leaves an existing tournament squad in place", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        competition_players: okResult([{ player_id: "player-1" }]),
      }),
    );

    const result = await ensureTournamentSquad("comp-1", "team-1");
    expect(result.error).toBeNull();
    expect(listRosterForTeamMock).not.toHaveBeenCalled();
  });

  it("fills an empty tournament squad when a competition becomes a tournament", async () => {
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-1" }],
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ team_id: "team-1" }),
        teams: okResult({ archived_at: null }),
        competition_players: [
          okResult([]),
          okResult([]),
          okResult([{ id: "cp-1" }]),
        ],
      }),
    );

    const result = await ensureTournamentSquad("comp-1", "team-1");
    expect(result.error).toBeNull();
    expect(listRosterForTeamMock).toHaveBeenCalledWith("team-1");
  });

  it("uses the tournament squad for a new match, not the full roster", async () => {
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-a" }, { id: "player-b" }, { id: "player-c" }],
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ kind: "tournament" }),
        competition_players: okResult([
          { player_id: "player-a" },
          { player_id: "player-left" },
          { player_id: "player-b" },
        ]),
      }),
    );

    const result = await initialMatchSquadPlayerIds("team-1", "comp-t");
    expect(result).toEqual({
      data: ["player-a", "player-b"],
      error: null,
    });
    expect(listRosterForTeamMock).toHaveBeenCalledWith("team-1", {
      includeInactive: true,
    });
  });

  it("starts a tournament match empty when the tournament squad is empty", async () => {
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-a" }, { id: "player-b" }],
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ kind: "tournament" }),
        competition_players: okResult([]),
      }),
    );

    const result = await initialMatchSquadPlayerIds("team-1", "comp-t");
    expect(result).toEqual({ data: [], error: null });
  });

  it("uses the active roster when the match is not in a tournament", async () => {
    listRosterForTeamMock.mockResolvedValue({
      data: [{ id: "player-1" }],
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        competitions: okResult({ kind: "league" }),
      }),
    );

    expect(await initialMatchSquadPlayerIds("team-1", "comp-league")).toEqual({
      data: ["player-1"],
      error: null,
    });
    expect(await initialMatchSquadPlayerIds("team-1", null)).toEqual({
      data: ["player-1"],
      error: null,
    });
    expect(listRosterForTeamMock).toHaveBeenCalledWith("team-1");
  });
});
