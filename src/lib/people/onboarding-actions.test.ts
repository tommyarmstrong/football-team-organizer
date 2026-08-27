import { beforeEach, describe, expect, it, vi } from "vitest";
import { personFixture } from "@/test/fixtures";

const {
  createAdminClientMock,
  createClientMock,
  loadInvitationByTokenMock,
  findAuthUserIdByEmailMock,
  linkAuthUserToPersonMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createClientMock: vi.fn(),
  loadInvitationByTokenMock: vi.fn(),
  findAuthUserIdByEmailMock: vi.fn(),
  linkAuthUserToPersonMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/people/invitations", () => ({
  loadInvitationByToken: loadInvitationByTokenMock,
  findAuthUserIdByEmail: findAuthUserIdByEmailMock,
  linkAuthUserToPerson: linkAuthUserToPersonMock,
}));

import { acceptInvitationWithPassword } from "@/lib/people/onboarding-actions";

describe("acceptInvitationWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadInvitationByTokenMock.mockResolvedValue({
      invitation: {
        id: "inv-1",
        email: "ada@example.com",
      },
      person: personFixture({ id: "person-1", email: "ada@example.com" }),
      error: null,
    });
    createAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-new" } },
            error: null,
          }),
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    });
    linkAuthUserToPersonMock.mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      },
    });
  });

  it("returns invalid invitation errors", async () => {
    loadInvitationByTokenMock.mockResolvedValue({
      invitation: null,
      person: null,
      error: "bad token",
    });
    expect(
      await acceptInvitationWithPassword({
        token: "x",
        password: "Password123!",
      }),
    ).toEqual({ error: "bad token" });
  });

  it("creates a new auth user and signs in", async () => {
    const result = await acceptInvitationWithPassword({
      token: "token",
      password: "Password123!",
    });
    expect(result).toEqual({ success: "Account created." });
    expect(linkAuthUserToPersonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        personId: "person-1",
        authUserId: "auth-new",
      }),
    );
  });

  it("falls back to existing auth user when create fails", async () => {
    createAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "User already registered" },
          }),
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    });
    findAuthUserIdByEmailMock.mockResolvedValue({
      id: "auth-existing",
      error: null,
    });

    const result = await acceptInvitationWithPassword({
      token: "token",
      password: "Password123!",
    });
    expect(result).toEqual({ success: "Account linked." });
  });

  it("surfaces missing existing user errors", async () => {
    createAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "create failed" },
          }),
          updateUserById: vi.fn(),
        },
      },
    });
    findAuthUserIdByEmailMock.mockResolvedValue({ id: null, error: null });

    expect(
      await acceptInvitationWithPassword({
        token: "token",
        password: "Password123!",
      }),
    ).toMatchObject({
      error: expect.stringMatching(/create failed|could not/i),
    });
  });
});
