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
  setGuardianActiveRole,
  unlinkGuardianFromPlayer,
  updateGuardian,
  updateGuardianPlayerLink,
  syncEmergencyContactFlagFromGuardianId,
  syncPlayerContactsEmergencyGuardian,
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

  it("sorts guardians by last then first name", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        guardians: okResult([
          {
            ...guardianRow,
            id: "g-b",
            person: personFixture({ first_name: "Zoe", last_name: "Parent" }),
            player_guardians: [],
          },
          {
            ...guardianRow,
            id: "g-a",
            person: personFixture({ first_name: "Amy", last_name: "Parent" }),
            player_guardians: [],
          },
        ]),
      }),
    );
    const listed = await listGuardians();
    expect(listed.data.map((row) => row.first_name)).toEqual(["Amy", "Zoe"]);
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

  it("maps list/get/link query errors and missing rows", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: errResult("list fail") }),
    );
    expect(await listGuardians()).toEqual({ data: [], error: "list fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: errResult("get fail") }),
    );
    expect(await getGuardian("g-1")).toEqual({
      data: null,
      error: "get fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(null) }),
    );
    expect(await getGuardian("g-1")).toEqual({ data: null, error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ player_guardians: errResult("links fail") }),
    );
    expect(await getGuardianPlayers("g-1")).toEqual({
      data: [],
      error: "links fail",
    });
    expect(await getPlayerGuardians("player-1")).toEqual({
      data: [],
      error: "links fail",
    });
  });

  it("unwraps array embeds when listing and loading links", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        guardians: okResult([
          {
            ...guardianRow,
            player_guardians: [
              {
                id: "pg-1",
                player_id: "player-1",
                relationship: "parent",
                legal_guardian: true,
                emergency_contact: false,
                player: [
                  {
                    person_id: "person-p",
                    person: [{ first_name: "Sam", last_name: "Striker" }],
                  },
                ],
              },
            ],
          },
        ]),
      }),
    );
    expect((await listGuardians()).data[0]?.players[0]?.player_first_name).toBe(
      "Sam",
    );

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: okResult([
          {
            id: "pg-1",
            player_id: "player-1",
            relationship: "parent",
            legal_guardian: true,
            emergency_contact: false,
            player: [
              {
                person_id: "person-p",
                person: [{ first_name: "Sam", last_name: "Striker" }],
              },
            ],
          },
        ]),
      }),
    );
    expect((await getGuardianPlayers("g-1")).data[0]?.player_person_id).toBe(
      "person-p",
    );

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: okResult([
          {
            id: "pg-1",
            guardian_id: "g-1",
            relationship: "parent",
            legal_guardian: true,
            emergency_contact: false,
            guardian: [
              {
                person_id: "person-1",
                person: [
                  personFixture({ first_name: "Pat", last_name: "Parent" }),
                ],
              },
            ],
          },
        ]),
      }),
    );
    expect((await getPlayerGuardians("player-1")).data[0]?.first_name).toBe(
      "Pat",
    );
  });

  it("maps create/update person and insert errors", async () => {
    createPersonMock.mockResolvedValue({ data: null, error: "person fail" });
    expect(
      await createGuardian({
        club_id: "club-1",
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "person fail" });

    createPersonMock.mockResolvedValue({ data: null, error: null });
    expect(
      await createGuardian({
        club_id: "club-1",
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "Could not create person." });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: errResult("insert fail") }),
    );
    expect(
      await createGuardian({
        club_id: "club-1",
        person_id: "person-1",
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "insert fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: errResult("load fail") }),
    );
    expect(
      await updateGuardian("g-1", {
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "load fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(null) }),
    );
    expect(
      await updateGuardian("g-1", {
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "Guardian not found." });

    updatePersonMock.mockResolvedValue({ error: "person write" });
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(guardianRow) }),
    );
    expect(
      await updateGuardian("g-1", {
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: null,
      }),
    ).toEqual({ data: null, error: "person write" });

    updatePersonMock.mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue(
      mockFromClient({
        guardians: [okResult(guardianRow), errResult("notes fail")],
      }),
    );
    expect(
      await updateGuardian("g-1", {
        first_name: "Pat",
        second_name: "Parent",
        phone: null,
        email: null,
        notes: "n",
      }),
    ).toEqual({ data: null, error: "notes fail" });
  });

  it("sets active role and maps remaining link/sync errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ guardians: okResult(null) }),
    );
    expect(await setGuardianActiveRole("g-1", false)).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: errResult("insert fail"),
      }),
    );
    expect(
      await linkGuardianToPlayer({
        guardian_id: "g-1",
        player_id: "player-1",
        relationship: "parent",
        legal_guardian: true,
      }),
    ).toEqual({ error: "insert fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [errResult("clear fail"), okResult(null)],
      }),
    );
    expect(
      await linkGuardianToPlayer({
        guardian_id: "g-1",
        player_id: "player-1",
        relationship: "parent",
        legal_guardian: true,
        emergency_contact: true,
      }),
    ).toEqual({ error: "clear fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [okResult(null), okResult(null)],
        player_contacts: [okResult(null), okResult(null)],
      }),
    );
    expect(
      await linkGuardianToPlayer({
        guardian_id: "g-1",
        player_id: "player-1",
        relationship: "parent",
        legal_guardian: true,
        emergency_contact: true,
      }),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ player_guardians: errResult("load fail") }),
    );
    expect(await updateGuardianPlayerLink("pg-1", {})).toEqual({
      error: "load fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ player_guardians: okResult(null) }),
    );
    expect(await updateGuardianPlayerLink("pg-1", {})).toEqual({
      error: "Relationship not found.",
    });

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
      }),
    );
    expect(
      await updateGuardianPlayerLink("pg-1", { relationship: "guardian" }),
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
          errResult("update fail"),
        ],
      }),
    );
    expect(
      await updateGuardianPlayerLink("pg-1", { legal_guardian: false }),
    ).toEqual({ error: "update fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [
          okResult({
            player_id: "player-1",
            guardian_id: "g-1",
            emergency_contact: true,
          }),
          errResult("unlink fail"),
        ],
      }),
    );
    expect(await unlinkGuardianFromPlayer("pg-1")).toEqual({
      error: "unlink fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [
          okResult({
            player_id: "player-1",
            guardian_id: "g-1",
            emergency_contact: true,
          }),
          okResult(null),
        ],
        player_contacts: [okResult({ player_id: "player-1" }), okResult(null)],
      }),
    );
    expect(await unlinkGuardianFromPlayer("pg-1")).toEqual({ error: null });
  });

  it("syncs emergency contact flags and player_contacts rows", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        player_contacts: [okResult({ player_id: "player-1" }), okResult(null)],
      }),
    );
    expect(
      await syncPlayerContactsEmergencyGuardian("player-1", "g-1"),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_contacts: [okResult(null), okResult(null)],
      }),
    );
    expect(
      await syncPlayerContactsEmergencyGuardian("player-1", "g-1"),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ player_contacts: okResult(null) }),
    );
    expect(await syncPlayerContactsEmergencyGuardian("player-1", null)).toEqual(
      { error: null },
    );

    createClientMock.mockResolvedValue(
      mockFromClient({ player_guardians: errResult("clear fail") }),
    );
    expect(
      await syncEmergencyContactFlagFromGuardianId("player-1", "g-1"),
    ).toEqual({ error: "clear fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ player_guardians: okResult(null) }),
    );
    expect(
      await syncEmergencyContactFlagFromGuardianId("player-1", null),
    ).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({
        player_guardians: [okResult(null), okResult(null)],
      }),
    );
    expect(
      await syncEmergencyContactFlagFromGuardianId("player-1", "g-1"),
    ).toEqual({ error: null });
  });
});
