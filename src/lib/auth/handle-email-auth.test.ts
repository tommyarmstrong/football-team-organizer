import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Person, PersonInvitation } from "@/lib/supabase/database.types";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";

const {
  createClientMock,
  cookiesSetMock,
  loadInvitationByTokenMock,
  linkAuthUserToPersonMock,
  findPersonForVerifiedEmailMock,
  findPersonForAuthUserIdMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  cookiesSetMock: vi.fn(),
  loadInvitationByTokenMock: vi.fn(),
  linkAuthUserToPersonMock: vi.fn(),
  findPersonForVerifiedEmailMock: vi.fn(),
  findPersonForAuthUserIdMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: cookiesSetMock,
    delete: vi.fn(),
  }),
}));

vi.mock("@/lib/people/invitations", () => ({
  loadInvitationByToken: loadInvitationByTokenMock,
  linkAuthUserToPerson: linkAuthUserToPersonMock,
  findPersonForVerifiedEmail: findPersonForVerifiedEmailMock,
  findPersonForAuthUserId: findPersonForAuthUserIdMock,
}));

import { handleEmailAuthRequest } from "@/lib/auth/handle-email-auth";

const user = { id: "auth-1", email: "ada@example.com" };

const invitation = {
  id: "inv-1",
  email: "ada@example.com",
} as PersonInvitation;

const person = {
  id: "person-1",
  first_name: "Ada",
  last_name: "Lovelace",
} as Person;

function authClient({
  exchangeError = null,
  verifyError = null,
  sessionUser = user,
}: {
  exchangeError?: string | null;
  verifyError?: string | null;
  sessionUser?: typeof user | null;
} = {}) {
  return {
    auth: {
      exchangeCodeForSession: vi.fn(async () =>
        exchangeError
          ? {
              data: { session: null, user: null },
              error: { message: exchangeError },
            }
          : { data: { session: {}, user: sessionUser }, error: null },
      ),
      verifyOtp: vi.fn(async () =>
        verifyError
          ? {
              data: { session: null, user: null },
              error: { message: verifyError },
            }
          : { data: { session: {}, user: sessionUser }, error: null },
      ),
      getUser: vi.fn(async () => ({
        data: { user: sessionUser },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
}

function request(path: string) {
  return new Request(`https://tracker.example.com${path}`);
}

describe("handleEmailAuthRequest", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    cookiesSetMock.mockReset();
    loadInvitationByTokenMock.mockReset();
    linkAuthUserToPersonMock.mockReset();
    findPersonForVerifiedEmailMock.mockReset();
    findPersonForAuthUserIdMock.mockReset();
    loadInvitationByTokenMock.mockResolvedValue({
      invitation,
      person,
      error: null,
    });
    linkAuthUserToPersonMock.mockResolvedValue({ error: null });
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: { ...person, auth_user_id: null },
      error: null,
    });
    findPersonForAuthUserIdMock.mockResolvedValue({ data: null, error: null });
  });

  it("exchanges a PKCE code, links the invite, and sets the invite cookie", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=abc&type=invite&invite_token=tok"),
    );

    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(loadInvitationByTokenMock).toHaveBeenCalledWith("tok");
    expect(linkAuthUserToPersonMock).toHaveBeenCalledWith({
      personId: "person-1",
      authUserId: "auth-1",
      email: "ada@example.com",
      invitationId: "inv-1",
    });
    expect(cookiesSetMock).toHaveBeenCalledWith(
      PASSWORD_SETUP_COOKIE,
      "invite",
      expect.objectContaining({ httpOnly: true, path: "/", sameSite: "lax" }),
    );
    expect(response.headers.get("location")).toBe(
      "https://tracker.example.com/auth/invite",
    );
  });

  it("verifies a token_hash recovery link and sets the recovery cookie", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await handleEmailAuthRequest(
      request("/auth/confirm?token_hash=hash&type=recovery"),
    );

    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "hash",
    });
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(cookiesSetMock).toHaveBeenCalledWith(
      PASSWORD_SETUP_COOKIE,
      "recovery",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(response.headers.get("location")).toBe(
      "https://tracker.example.com/auth/reset-password",
    );
  });

  it("redirects failed invite exchanges to /auth/invite", async () => {
    createClientMock.mockResolvedValue(
      authClient({ exchangeError: "Invalid code" }),
    );

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=bad&type=invite"),
    );

    expect(response.headers.get("location")).toBe(
      "https://tracker.example.com/auth/invite?error=Invalid%20code",
    );
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });

  it("redirects failed recovery exchanges to /auth/reset-password", async () => {
    createClientMock.mockResolvedValue(authClient({ verifyError: "Expired" }));

    const response = await handleEmailAuthRequest(
      request("/auth/confirm?token_hash=old&type=recovery"),
    );

    expect(response.headers.get("location")).toBe(
      "https://tracker.example.com/auth/reset-password?error=Expired",
    );
  });

  it("requires a token on the confirm endpoint", async () => {
    createClientMock.mockResolvedValue(authClient({ sessionUser: null }));

    const response = await handleEmailAuthRequest(request("/auth/confirm"), {
      requireToken: true,
    });

    expect(response.headers.get("location")).toContain("/login?error=");
  });

  it("rejects invite sessions whose email does not match", async () => {
    createClientMock.mockResolvedValue(authClient());
    loadInvitationByTokenMock.mockResolvedValue({
      invitation: { ...invitation, email: "other@example.com" },
      person,
      error: null,
    });

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=abc&invite_token=tok"),
    );

    expect(linkAuthUserToPersonMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain(
      "/onboarding/accept?token=tok",
    );
    expect(response.headers.get("location")).toContain(
      "Signed-in%20email%20does%20not%20match",
    );
  });

  it("links an unmatched person by verified email when there is no invite token", async () => {
    createClientMock.mockResolvedValue(authClient());

    await handleEmailAuthRequest(
      request("/auth/callback?code=abc&type=invite"),
    );

    expect(findPersonForVerifiedEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
    );
    expect(linkAuthUserToPersonMock).toHaveBeenCalledWith({
      personId: "person-1",
      authUserId: "auth-1",
      email: "ada@example.com",
    });
  });

  it("signs out and denies access when linking throws (missing service role)", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);
    loadInvitationByTokenMock.mockRejectedValue(new Error("no service role"));

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=abc&type=invite&invite_token=tok"),
    );

    expect(client.auth.signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/login?error=");
    expect(response.headers.get("location")).toContain("invitation");
  });

  it("allows ordinary OAuth when the person is already linked", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: { ...person, auth_user_id: "auth-1" },
      error: null,
    });

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=abc&next=%2Fdashboard"),
    );

    expect(cookiesSetMock).not.toHaveBeenCalled();
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://tracker.example.com/dashboard",
    );
  });

  it("signs out uninvited Google users with no people row", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: null,
      error: null,
    });
    findPersonForAuthUserIdMock.mockResolvedValue({ data: null, error: null });

    const response = await handleEmailAuthRequest(
      request("/auth/callback?code=abc&next=%2Fdashboard"),
    );

    expect(client.auth.signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/login?error=");
    expect(
      decodeURIComponent(response.headers.get("location") ?? ""),
    ).toContain("invitation");
  });
});
