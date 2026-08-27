import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult } from "@/test/supabase-mock";
import { personFixture } from "@/test/fixtures";
import { createInvitationToken } from "@/lib/people/person";

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));
vi.mock("@/lib/auth/origin", () => ({
  appOrigin: () => "http://localhost:3000",
}));

import {
  findAuthUserIdByEmail,
  findPersonForVerifiedEmail,
  linkAuthUserToPerson,
  loadInvitationByToken,
  sendPersonInvitation,
} from "@/lib/people/invitations";

function adminClient(
  fromImpl: ReturnType<typeof mockFromClient>,
  authAdmin?: Record<string, unknown>,
) {
  return {
    ...fromImpl,
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [], nextPage: null },
          error: null,
        }),
        inviteUserByEmail: vi.fn().mockResolvedValue({ error: null }),
        ...authAdmin,
      },
    },
  };
}

describe("people invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds auth users by email across pages", async () => {
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          users: [{ id: "u1", email: "other@example.com" }],
          nextPage: 2,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          users: [{ id: "u2", email: "Ada@Example.com" }],
          nextPage: null,
        },
        error: null,
      });
    createAdminClientMock.mockReturnValue(
      adminClient(mockFromClient({}), { listUsers }),
    );

    expect(await findAuthUserIdByEmail("ada@example.com")).toEqual({
      id: "u2",
      error: null,
    });
  });

  it("sends invitations and returns accept url when email fails", async () => {
    const from = mockFromClient({
      person_invitations: [okResult(null), okResult({ id: "inv-1" })],
      people: okResult(null),
    });
    const inviteUserByEmail = vi.fn().mockResolvedValue({
      error: { message: "User already registered" },
    });
    createAdminClientMock.mockReturnValue(
      adminClient(from, { inviteUserByEmail }),
    );

    const result = await sendPersonInvitation({
      person: personFixture({ email: "ada@example.com" }),
      invitedBy: "user-1",
      clubName: "Example FC",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.emailSent).toBe(false);
      expect(result.alreadyRegistered).toBe(true);
      expect(result.acceptUrl).toMatch(/onboarding\/accept/);
    }
  });

  it("rejects invitations without email or with existing auth", async () => {
    expect(
      await sendPersonInvitation({
        person: personFixture({ email: null }),
        invitedBy: null,
      }),
    ).toMatchObject({ ok: false });

    expect(
      await sendPersonInvitation({
        person: personFixture({ auth_user_id: "auth-1" }),
        invitedBy: null,
      }),
    ).toMatchObject({ ok: false });
  });

  it("loads invitations by token and evaluates usability", async () => {
    expect(await loadInvitationByToken("")).toMatchObject({
      error: expect.stringMatching(/missing/i),
    });

    const { token, tokenHash } = createInvitationToken();
    const invitation = {
      id: "inv-1",
      person_id: "person-1",
      email: "ada@example.com",
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      accepted_at: null,
      revoked_at: null,
      invited_by: null,
      created_at: new Date().toISOString(),
    };
    createAdminClientMock.mockReturnValue(
      adminClient(
        mockFromClient({
          person_invitations: okResult(invitation),
          people: okResult(personFixture({ id: "person-1" })),
        }),
      ),
    );

    const loaded = await loadInvitationByToken(token);
    expect(loaded.error).toBeNull();
    expect(loaded.person?.id).toBe("person-1");
  });

  it("links auth users and finds people by verified email", async () => {
    createAdminClientMock.mockReturnValue(
      adminClient(
        mockFromClient({
          people: [okResult(null), okResult(null)],
          person_invitations: okResult(null),
        }),
      ),
    );

    expect(
      await linkAuthUserToPerson({
        personId: "person-1",
        authUserId: "auth-1",
        email: "ada@example.com",
        invitationId: "inv-1",
      }),
    ).toEqual({ error: null });

    createAdminClientMock.mockReturnValue(
      adminClient(
        mockFromClient({
          people: okResult(personFixture({ email: "ada@example.com" })),
        }),
      ),
    );
    expect(
      (await findPersonForVerifiedEmail("Ada@Example.com")).data?.email,
    ).toBe("ada@example.com");
  });

  it("maps listUsers errors", async () => {
    createAdminClientMock.mockReturnValue(
      adminClient(mockFromClient({}), {
        listUsers: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "list fail" },
        }),
      }),
    );
    expect(await findAuthUserIdByEmail("a@b.com")).toEqual({
      id: null,
      error: "list fail",
    });
  });
});
