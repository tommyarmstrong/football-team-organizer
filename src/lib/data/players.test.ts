import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture, teamFixture } from "@/test/fixtures";

const {
  createClientMock,
  createPersonMock,
  updatePersonMock,
  getActiveTeamMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createPersonMock: vi.fn(),
  updatePersonMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  updatePerson: updatePersonMock,
}));
vi.mock("@/lib/data/team", () => ({
  getActiveTeam: getActiveTeamMock,
}));

import {
  addPlayerToTeam,
  createPlayer,
  deletePlayer,
  getPlayer,
  getPlayerContact,
  getPlayerGoals,
  getPlayerTeams,
  listActiveRosterForActiveTeam,
  listPlayers,
  listPlayersNotOnTeam,
  listRosterForTeam,
  removePlayerFromTeam,
  setPlayerActiveRole,
  updatePlayer,
  updateRosterEntry,
  upsertPlayerContact,
} from "@/lib/data/players";

const playerRow = {
  id: "player-1",
  club_id: "club-1",
  person_id: "person-1",
  position: "Forward",
  school: null,
  date_of_birth: null,
  active_role: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  person: personFixture({ first_name: "Sam", last_name: "Striker" }),
};

describe("players data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    updatePersonMock.mockResolvedValue({ error: null });
  });

  it("maps roster rows and skips inactive player roles", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_players: okResult([
          {
            id: "tp-1",
            shirt_number: 7,
            active: true,
            player: {
              id: "player-1",
              person_id: "person-1",
              active_role: true,
              position: "Forward",
              person: { first_name: "Sam", last_name: "Striker" },
            },
          },
          {
            id: "tp-2",
            shirt_number: 9,
            active: true,
            player: {
              id: "player-2",
              person_id: "person-2",
              active_role: false,
              position: null,
              person: { first_name: "Skip", last_name: "Me" },
            },
          },
        ]),
      }),
    );

    const result = await listRosterForTeam("team-1");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: "player-1",
      shirt_number: 7,
      first_name: "Sam",
    });
  });

  it("lists players and active roster for the active team", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ players: okResult([playerRow]) }),
    );
    expect((await listPlayers()).data[0]?.first_name).toBe("Sam");

    createClientMock.mockResolvedValue(
      mockFromClient({
        team_players: okResult([
          {
            id: "tp-1",
            shirt_number: 7,
            active: true,
            player: {
              id: "player-1",
              person_id: "person-1",
              active_role: true,
              position: "Forward",
              person: { first_name: "Sam", last_name: "Striker" },
            },
          },
        ]),
      }),
    );
    expect((await listActiveRosterForActiveTeam()).data).toHaveLength(1);
  });

  it("gets player details, teams, contacts, and goals", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ players: okResult(playerRow) }),
    );
    expect((await getPlayer("player-1")).data?.id).toBe("player-1");

    createClientMock.mockResolvedValue(
      mockFromClient({
        team_players: okResult([
          {
            id: "tp-1",
            team_id: "team-1",
            shirt_number: 7,
            active: true,
            team: { name: "U12 Blues", season_label: "2025/26" },
          },
        ]),
        player_contacts: okResult({ player_id: "player-1", phone: "07000" }),
        goals: okResult([{ id: "goal-1", match_id: "match-1", minute: 10 }]),
      }),
    );
    expect((await getPlayerTeams("player-1")).data[0]?.team_id).toBe("team-1");
    expect((await getPlayerContact("player-1")).data?.phone).toBe("07000");
    expect((await getPlayerGoals("player-1")).data).toHaveLength(1);
  });

  it("creates a person then a player", async () => {
    createPersonMock.mockResolvedValue({
      data: { id: "person-new" },
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        players: okResult({
          ...playerRow,
          id: "player-new",
          person_id: "person-new",
        }),
      }),
    );

    const result = await createPlayer({
      club_id: "club-1",
      first_name: "Sam",
      last_name: "Striker",
    });
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("player-new");
    expect(createPersonMock).toHaveBeenCalled();
  });

  it("updates, toggles, deletes, and manages roster membership", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        players: [okResult(playerRow), okResult(playerRow)],
      }),
    );
    expect(
      (
        await updatePlayer("player-1", {
          first_name: "Sam",
          last_name: "Striker",
          position: "Midfield",
          school: null,
          date_of_birth: null,
        })
      ).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({
        players: okResult(null),
        team_players: okResult(null),
      }),
    );
    expect(await setPlayerActiveRole("player-1", false)).toEqual({
      error: null,
    });
    expect(await deletePlayer("player-1")).toEqual({ error: null });
    expect(await updateRosterEntry("tp-1", { shirt_number: 9 })).toEqual({
      error: null,
    });
    expect(await removePlayerFromTeam("tp-1")).toEqual({ error: null });
  });

  it("adds players to a team and upserts contacts", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        team_players: okResult(null),
        player_contacts: okResult(null),
      }),
    );
    expect(await addPlayerToTeam("team-1", "player-1", 7)).toEqual({
      error: null,
    });
    expect(
      await upsertPlayerContact("player-1", {
        phone: "07111",
        email: null,
        address: null,
        emergency_guardian_id: null,
        medical_notes: null,
      }),
    ).toEqual({ error: null });
  });

  it("lists players not on a team", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        players: okResult([
          playerRow,
          {
            ...playerRow,
            id: "player-2",
            person: personFixture({
              id: "p2",
              first_name: "Other",
              last_name: "Player",
            }),
          },
        ]),
        team_players: okResult([{ player_id: "player-1" }]),
      }),
    );
    const result = await listPlayersNotOnTeam("club-1", "team-1");
    expect(result.data.map((p) => p.id)).toEqual(["player-2"]);
  });

  it("maps roster query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ team_players: errResult("roster fail") }),
    );
    expect(await listRosterForTeam("team-1")).toEqual({
      data: [],
      error: "roster fail",
    });
  });
});
