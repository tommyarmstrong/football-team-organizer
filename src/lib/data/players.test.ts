import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";

const { createClientMock, createPersonMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createPersonMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  updatePerson: vi.fn(),
}));
vi.mock("@/lib/data/team", () => ({
  getActiveTeam: vi.fn(),
}));

import {
  addPlayerToTeam,
  createPlayer,
  listRosterForTeam,
  upsertPlayerContact,
} from "@/lib/data/players";

describe("players data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("creates a person then a player", async () => {
    createPersonMock.mockResolvedValue({
      data: { id: "person-new" },
      error: null,
    });
    createClientMock.mockResolvedValue(
      mockFromClient({
        players: okResult({
          id: "player-new",
          person_id: "person-new",
          club_id: "club-1",
          position: null,
          school: null,
          date_of_birth: null,
          active_role: true,
          person: { first_name: "Sam", last_name: "Striker" },
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
