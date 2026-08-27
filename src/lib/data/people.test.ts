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
  getPersonByAuthUserId,
  updatePerson,
} from "@/lib/data/people";

describe("people data writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
