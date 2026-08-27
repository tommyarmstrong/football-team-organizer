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
});
