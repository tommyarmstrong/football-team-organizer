import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";

const { createClientMock, deleteAuthUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  deleteAuthUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/people/delete-auth-user", () => ({
  deleteAuthUserById: deleteAuthUserMock,
}));

import {
  createPerson,
  deletePerson,
  getPerson,
  getPersonByAuthUserId,
  linkRoleToPerson,
  listPeople,
  listPreviousMembers,
  reactivatePerson,
  updatePerson,
} from "@/lib/data/people";

describe("people data writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists people into directory items", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult([
          {
            ...personFixture(),
            managers: [],
            coaches: [{ id: "c1", active_role: true }],
            guardians: [],
            players: [
              {
                id: "player-1",
                active_role: true,
                team_players: [{ team_id: "team-1" }],
                player_guardians: [],
              },
            ],
          },
        ]),
      }),
    );
    const listed = await listPeople();
    expect(listed.data[0]?.roles).toEqual({
      player: true,
      guardian: false,
      coach: true,
      manager: false,
    });
  });

  it("loads a person with roles and outstanding invitation", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ id: "person-1" })),
        managers: okResult([]),
        coaches: okResult([{ id: "c1", club_id: "club-1", active_role: true }]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([
          {
            id: "inv-1",
            person_id: "person-1",
            email: "ada@example.com",
            accepted_at: null,
            revoked_at: null,
          },
        ]),
      }),
    );
    const person = await getPerson("person-1");
    expect(person.data?.coaches).toHaveLength(1);
    expect(person.data?.outstanding_invitation?.id).toBe("inv-1");
  });

  it("links roles and deletes people", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        coaches: okResult(null),
        people: [
          okResult(personFixture({ auth_user_id: null })),
          okResult(null),
        ],
      }),
    );
    expect(
      await linkRoleToPerson({
        personId: "person-1",
        role: "coach",
        roleId: "coach-1",
      }),
    ).toEqual({ error: null });

    deleteAuthUserMock.mockResolvedValue({ error: null });
    expect(await deletePerson("person-1")).toEqual({ error: null });
  });

  it("soft-deletes people with player or coach history", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1", auth_user_id: "auth-1" })),
          okResult(null),
        ],
        managers: okResult([]),
        coaches: [
          okResult([{ id: "coach-1", club_id: "club-1", active_role: true }]),
          okResult(null),
        ],
        guardians: [
          okResult([
            { id: "guardian-1", club_id: "club-1", active_role: true },
          ]),
          okResult(null),
        ],
        players: [
          okResult([
            {
              id: "player-1",
              club_id: "club-1",
              active_role: true,
              position: null,
              school: null,
              date_of_birth: null,
            },
          ]),
          okResult(null),
        ],
        person_invitations: okResult([]),
        player_contacts: okResult(null),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: null });
    expect(deleteAuthUserMock).toHaveBeenCalledWith("auth-1");
  });

  it("soft-deletes guardian/manager people without removing the row", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1", auth_user_id: null })),
          okResult(null),
        ],
        managers: [
          okResult([{ id: "mgr-1", club_id: "club-1", active_role: true }]),
          okResult(null),
        ],
        coaches: okResult([]),
        guardians: [
          okResult([
            { id: "guardian-1", club_id: "club-1", active_role: true },
          ]),
          okResult(null),
        ],
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: null });
    expect(deleteAuthUserMock).not.toHaveBeenCalled();
  });

  it("deletes auth users when disabling linked people", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1", auth_user_id: "auth-1" })),
          okResult(null),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    deleteAuthUserMock.mockResolvedValue({ error: null });
    expect(await deletePerson("person-1")).toEqual({ error: null });
    expect(deleteAuthUserMock).toHaveBeenCalledWith("auth-1");
  });

  it("lists previous members and reactivates disabled people", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult([
          {
            ...personFixture({
              id: "person-old",
              account_status: "disabled",
            }),
            managers: [],
            coaches: [],
            guardians: [],
            players: [],
          },
        ]),
      }),
    );
    const previous = await listPreviousMembers();
    expect(previous.data[0]?.id).toBe("person-old");

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(
            personFixture({
              id: "person-old",
              account_status: "disabled",
              auth_user_id: null,
            }),
          ),
          okResult(null),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await reactivatePerson("person-old")).toEqual({ error: null });
  });

  it("rejects reactivating people who are not disabled", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ account_status: "active" })),
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await reactivatePerson("person-1")).toEqual({
      error: "This person is not a previous member.",
    });
  });

  it("normalizes email on create and maps unique violations", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ email: "ada@example.com" })),
      }),
    );
    const created = await createPerson({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "Ada@Example.com",
      account_status: "none",
    });
    expect(created.error).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: errResult(
          'duplicate key value violates unique constraint "people_email_lower_uidx"',
        ),
      }),
    );
    expect(
      await createPerson({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        account_status: "none",
      }),
    ).toEqual({
      data: null,
      error: "A person with that email already exists.",
    });
  });

  it("maps unique violations on update", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: errResult("people_email_lower_uidx"),
      }),
    );
    expect(await updatePerson("person-1", { email: "x@y.com" })).toEqual({
      data: null,
      error: "A person with that email already exists.",
    });
  });

  it("looks up a person by auth user id", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ auth_user_id: "auth-1" })),
      }),
    );
    const result = await getPersonByAuthUserId("auth-1");
    expect(result.data?.auth_user_id).toBe("auth-1");
  });

  it("maps list and get errors, including missing people", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("list fail") }),
    );
    expect(await listPeople()).toEqual({ data: [], error: "list fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("get fail") }),
    );
    expect(await getPerson("person-1")).toEqual({
      data: null,
      error: "get fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({ people: okResult(null) }),
    );
    expect(await getPerson("person-1")).toEqual({ data: null, error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("auth lookup") }),
    );
    expect(await getPersonByAuthUserId("auth-1")).toEqual({
      data: null,
      error: "auth lookup",
    });
  });

  it("maps generic create/update errors and clears email", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("insert failed") }),
    );
    expect(
      await createPerson({
        first_name: "Ada",
        last_name: "Lovelace",
        account_status: "none",
      }),
    ).toEqual({ data: null, error: "insert failed" });

    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("update failed") }),
    );
    expect(await updatePerson("person-1", { email: null })).toEqual({
      data: null,
      error: "update failed",
    });
  });

  it("maps directory emergency contacts and linked player teams", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult([
          {
            ...personFixture(),
            managers: [{ id: "m1", active_role: true }],
            coaches: [],
            guardians: [
              {
                id: "g1",
                active_role: true,
                player_guardians: [{ player_id: "player-2" }],
              },
            ],
            players: [
              {
                id: "player-1",
                active_role: true,
                team_players: [{ team_id: "team-1" }],
                player_guardians: [
                  { emergency_contact: false, guardian: null },
                  {
                    emergency_contact: true,
                    guardian: {
                      person: [
                        {
                          first_name: "Pat",
                          last_name: "Parent",
                          phone: "111",
                        },
                      ],
                    },
                  },
                ],
              },
              {
                id: "player-2",
                active_role: true,
                team_players: [{ team_id: "team-2" }],
                player_guardians: [],
              },
            ],
          },
        ]),
      }),
    );
    const listed = await listPeople();
    expect(listed.data[0]?.emergency_contact).toEqual({
      first_name: "Pat",
      last_name: "Parent",
      phone: "111",
    });
    expect(listed.data[0]?.linkedPlayerTeamIds).toEqual(["team-2"]);
    expect(listed.data[0]?.roles.manager).toBe(true);
  });

  it("maps deletePerson load, deactivate, invite, disable, and auth errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("load fail") }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: "load fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(null),
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({
      error: "Person not found.",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ id: "person-1" })),
        managers: okResult([]),
        coaches: okResult([]),
        guardians: [
          okResult([{ id: "g1", club_id: "club-1", active_role: true }]),
          errResult("guardian write"),
        ],
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({
      error: "guardian write",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ id: "person-1" })),
        managers: [
          okResult([{ id: "m1", club_id: "club-1", active_role: true }]),
          errResult("manager write"),
        ],
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: "manager write" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ id: "person-1" })),
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: [
          okResult([
            {
              id: "p1",
              club_id: "club-1",
              active_role: true,
              position: null,
              school: null,
              date_of_birth: null,
            },
          ]),
          errResult("player write"),
        ],
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: "player write" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(personFixture({ id: "person-1" })),
        managers: okResult([]),
        coaches: [
          okResult([{ id: "c1", club_id: "club-1", active_role: true }]),
          errResult("coach write"),
        ],
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: "coach write" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1" })),
          errResult("disable fail"),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: [okResult([]), errResult("invite fail")],
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: "invite fail" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1" })),
          errResult("disable fail"),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: [okResult([]), okResult(null)],
      }),
    );
    expect(await deletePerson("person-1")).toEqual({
      error: "disable fail",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(personFixture({ id: "person-1", auth_user_id: "auth-1" })),
          okResult(null),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    deleteAuthUserMock.mockResolvedValue({ error: "auth fail" });
    expect(await deletePerson("person-1")).toEqual({ error: "auth fail" });
  });

  it("skips inactive roles on delete and maps reactivate edges", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [okResult(personFixture({ id: "person-1" })), okResult(null)],
        managers: okResult([
          { id: "m1", club_id: "club-1", active_role: false },
        ]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: [okResult([]), okResult(null)],
      }),
    );
    expect(await deletePerson("person-1")).toEqual({ error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ people: errResult("load") }),
    );
    expect(await reactivatePerson("person-1")).toEqual({ error: "load" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: okResult(null),
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await reactivatePerson("person-1")).toEqual({
      error: "Person not found.",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        people: [
          okResult(
            personFixture({
              account_status: "disabled",
              auth_user_id: "auth-1",
            }),
          ),
          errResult("reactivate fail"),
        ],
        managers: okResult([]),
        coaches: okResult([]),
        guardians: okResult([]),
        players: okResult([]),
        person_invitations: okResult([]),
      }),
    );
    expect(await reactivatePerson("person-1")).toEqual({
      error: "reactivate fail",
    });
  });

  it("links manager, guardian, and player roles", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        managers: okResult(null),
        guardians: okResult(null),
        players: okResult(null),
      }),
    );
    expect(
      await linkRoleToPerson({
        personId: "person-1",
        role: "manager",
        roleId: "mgr-1",
      }),
    ).toEqual({ error: null });
    expect(
      await linkRoleToPerson({
        personId: "person-1",
        role: "guardian",
        roleId: "g-1",
      }),
    ).toEqual({ error: null });
    expect(
      await linkRoleToPerson({
        personId: "person-1",
        role: "player",
        roleId: "p-1",
      }),
    ).toEqual({ error: null });
  });
});
