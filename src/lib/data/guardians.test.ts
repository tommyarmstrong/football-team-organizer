import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";

const { createClientMock, createPersonMock, updatePersonMock } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    createPersonMock: vi.fn(),
    updatePersonMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/data/people", () => ({
  createPerson: createPersonMock,
  updatePerson: updatePersonMock,
}));

import {
  createGuardian,
  deleteGuardian,
  getGuardian,
  getGuardianPlayers,
  getPlayerGuardians,
  linkGuardianToPlayer,
  listGuardians,
  unlinkGuardianFromPlayer,
  updateGuardian,
  updateGuardianPlayerLink,
} from "@/lib/data/guardians";

const guardianRow = {
  id: "g-1",
  club_id: "club-1",
  person_id: "person-1",
  notes: null,
  active_role: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  person: personFixture({ first_name: "Pat", last_name: "Parent" }),
  player_guardians: [
    {
      id: "pg-1",
      player_id: "player-1",
      relationship: "parent",
      legal_guardian: true,
      emergency_contact: false,
      player: {
        person_id: "person-p",
        person: { first_name: "Sam", last_name: "Striker" },
      },
    },
  ],
};

describe("guardians data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPersonMock.mockResolvedValue({
      data: personFixture({ id: "person-new" }),
      error: null,
    });
    updatePersonMock.mockResolvedValue({ error: null });
  });

  it("lists guardians with linked players", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult([guardianRow]) }),
    );
    const listed = await listGuardians();
    expect(listed.data[0]?.players[0]?.player_first_name).toBe("Sam");
  });

  it("gets guardian and related links", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(guardianRow) }),
    );
    expect((await getGuardian("g-1")).data?.first_name).toBe("Pat");

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: okResult([
          {
            id: "pg-1",
            player_id: "player-1",
            relationship: "parent",
            legal_guardian: true,
            emergency_contact: false,
            player: {
              person_id: "person-p",
              person: { first_name: "Sam", last_name: "Striker" },
            },
          },
        ]),
      }),
    );
    expect((await getGuardianPlayers("g-1")).data[0]?.player_id).toBe(
      "player-1",
    );

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: okResult([
          {
            id: "pg-1",
            guardian_id: "g-1",
            relationship: "parent",
            legal_guardian: true,
            emergency_contact: true,
            guardian: {
              id: "g-1",
              person_id: "person-1",
              person: personFixture({ first_name: "Pat", last_name: "Parent" }),
            },
          },
        ]),
      }),
    );
    expect((await getPlayerGuardians("player-1")).data[0]?.guardian_id).toBe(
      "g-1",
    );
  });

  it("creates and updates guardians", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(guardianRow) }),
    );
    expect(
      (
        await createGuardian({
          club_id: "club-1",
          first_name: "Pat",
          second_name: "Parent",
          phone: null,
          email: null,
          notes: null,
        })
      ).data?.id,
    ).toBe("g-1");

    createClientMock.mockResolvedValue(
      mockFromClient({
        guardians: [okResult(guardianRow), okResult(guardianRow)],
      }),
    );
    expect(
      (
        await updateGuardian("g-1", {
          first_name: "Pat",
          second_name: "Parent",
          phone: null,
          email: null,
          notes: "n",
        })
      ).error,
    ).toBeNull();
  });

  it("links, updates, and unlinks players", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: okResult(null),
        player_contacts: okResult(null),
      }),
    );
    expect(
      await linkGuardianToPlayer({
        guardian_id: "g-1",
        player_id: "player-1",
        relationship: "parent",
        legal_guardian: true,
      }),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [
          okResult({
            id: "pg-1",
            player_id: "player-1",
            guardian_id: "g-1",
            emergency_contact: false,
          }),
          okResult(null),
        ],
        player_contacts: okResult(null),
      }),
    );
    expect(
      await updateGuardianPlayerLink("pg-1", {
        relationship: "guardian",
        emergency_contact: true,
      }),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [
          okResult({
            player_id: "player-1",
            guardian_id: "g-1",
            emergency_contact: false,
          }),
          okResult(null),
        ],
      }),
    );
    expect(await unlinkGuardianFromPlayer("pg-1")).toEqual({ error: null });
  });

  it("maps unique link errors and deletes", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: errResult("player_guardians_unique"),
      }),
    );
    expect(
      await linkGuardianToPlayer({
        guardian_id: "g-1",
        player_id: "player-1",
        relationship: "parent",
        legal_guardian: false,
      }),
    ).toMatchObject({ error: expect.stringMatching(/already linked/i) });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(null) }),
    );
    expect(await deleteGuardian("g-1")).toEqual({ error: null });
  });
});
