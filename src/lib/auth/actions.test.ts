import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Person, PersonInvitation } from "@/lib/supabase/database.types";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";

const {
  createClientMock,
  cookiesDeleteMock,
  loadInvitationByTokenMock,
  linkAuthUserToPersonMock,
  findPersonForVerifiedEmailMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  cookiesDeleteMock: vi.fn(),
  loadInvitationByTokenMock: vi.fn(),
  linkAuthUserToPersonMock: vi.fn(),
  findPersonForVerifiedEmailMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: vi.fn(),
    delete: cookiesDeleteMock,
  }),
}));

vi.mock("@/lib/people/invitations", () => ({
  loadInvitationByToken: loadInvitationByTokenMock,
  linkAuthUserToPerson: linkAuthUserToPersonMock,
  findPersonForVerifiedEmail: findPersonForVerifiedEmailMock,
}));

import {
  requestOwnPasswordResetAction,
  requestPasswordResetAction,
  updatePasswordAndFinishAction,
} from "@/lib/auth/actions";

const user = { id: "auth-1", email: "ada@example.com" };

function authClient({
  sessionUser = user as { id: string; email?: string | null } | null,
  resetError = null as string | null,
  updateError = null as string | null,
} = {}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: sessionUser },
        error: null,
      })),
      resetPasswordForEmail: vi.fn(async () =>
        resetError
          ? { data: null, error: { message: resetError } }
          : { data: {}, error: null },
      ),
      updateUser: vi.fn(async () =>
        updateError
          ? { data: { user: null }, error: { message: updateError } }
          : { data: { user: sessionUser }, error: null },
      ),
    },
  };
}

describe("password reset and set-password actions", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    cookiesDeleteMock.mockReset();
    loadInvitationByTokenMock.mockReset();
    linkAuthUserToPersonMock.mockReset();
    findPersonForVerifiedEmailMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tracker.example.com");
    vi.stubEnv("VERCEL_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a blank reset email without calling Supabase", async () => {
    const result = await requestPasswordResetAction({ email: "  " });
    expect(result).toEqual({ error: "Enter your email address." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("sends a reset email that returns to /auth/reset-password", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);

    const result = await requestPasswordResetAction({
      email: " ada@example.com ",
    });

    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "ada@example.com",
      { redirectTo: "https://tracker.example.com/auth/reset-password" },
    );
    expect(result.success).toMatch(/password reset link/i);
    expect(result.error).toBeUndefined();
  });

  it("returns the Supabase error when sending a reset email fails", async () => {
    createClientMock.mockResolvedValue(
      authClient({ resetError: "rate limited" }),
    );

    const result = await requestPasswordResetAction({
      email: "ada@example.com",
    });
    expect(result).toEqual({ error: "rate limited" });
  });

  it("requires a signed-in email for own-account reset", async () => {
    createClientMock.mockResolvedValue(authClient({ sessionUser: null }));
    expect(await requestOwnPasswordResetAction()).toEqual({
      error: "Not signed in.",
    });

    createClientMock.mockResolvedValue(
      authClient({ sessionUser: { id: "auth-1", email: null } }),
    );
    expect(await requestOwnPasswordResetAction()).toEqual({
      error: "Not signed in.",
    });
  });

  it("sends a reset email to the signed-in user", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);

    const result = await requestOwnPasswordResetAction();
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "ada@example.com",
      { redirectTo: "https://tracker.example.com/auth/reset-password" },
    );
    expect(result.success).toBeTruthy();
  });

  it("rejects a weak new password without updating the user", async () => {
    const result = await updatePasswordAndFinishAction({
      password: "short",
      confirm: "short",
    });
    expect(result.error).toMatch(/at least 8 characters/i);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated session to set a password", async () => {
    createClientMock.mockResolvedValue(authClient({ sessionUser: null }));

    const result = await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
    });
    expect(result.error).toMatch(/expired or is no longer valid/i);
  });

  it("returns updateUser errors", async () => {
    createClientMock.mockResolvedValue(
      authClient({ updateError: "Password is too weak" }),
    );

    const result = await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
    });
    expect(result).toEqual({ error: "Password is too weak" });
    expect(cookiesDeleteMock).not.toHaveBeenCalled();
  });

  it("links a matching invite then clears the password-setup cookie", async () => {
    const client = authClient();
    createClientMock.mockResolvedValue(client);
    loadInvitationByTokenMock.mockResolvedValue({
      invitation: { id: "inv-1", email: "ada@example.com" } as PersonInvitation,
      person: { id: "person-1" } as Person,
      error: null,
    });
    linkAuthUserToPersonMock.mockResolvedValue({ error: null });

    const result = await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
      inviteToken: " tok ",
    });

    expect(client.auth.updateUser).toHaveBeenCalledWith({
      password: "password1",
    });
    expect(loadInvitationByTokenMock).toHaveBeenCalledWith("tok");
    expect(linkAuthUserToPersonMock).toHaveBeenCalledWith({
      personId: "person-1",
      authUserId: "auth-1",
      email: "ada@example.com",
      invitationId: "inv-1",
    });
    expect(cookiesDeleteMock).toHaveBeenCalledWith(PASSWORD_SETUP_COOKIE);
    expect(result).toEqual({});
  });

  it("does not link when the invite email does not match the session", async () => {
    createClientMock.mockResolvedValue(authClient());
    loadInvitationByTokenMock.mockResolvedValue({
      invitation: {
        id: "inv-1",
        email: "other@example.com",
      } as PersonInvitation,
      person: { id: "person-1" } as Person,
      error: null,
    });

    await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
      inviteToken: "tok",
    });

    expect(linkAuthUserToPersonMock).not.toHaveBeenCalled();
    expect(cookiesDeleteMock).toHaveBeenCalledWith(PASSWORD_SETUP_COOKIE);
  });

  it("links by verified email when no invite token is present", async () => {
    createClientMock.mockResolvedValue(authClient());
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: { id: "person-1", auth_user_id: null } as Person,
      error: null,
    });
    linkAuthUserToPersonMock.mockResolvedValue({ error: null });

    await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
    });

    expect(findPersonForVerifiedEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
    );
    expect(linkAuthUserToPersonMock).toHaveBeenCalledWith({
      personId: "person-1",
      authUserId: "auth-1",
      email: "ada@example.com",
    });
  });

  it("does not relink a person that already has an auth user", async () => {
    createClientMock.mockResolvedValue(authClient());
    findPersonForVerifiedEmailMock.mockResolvedValue({
      data: { id: "person-1", auth_user_id: "other" } as Person,
      error: null,
    });

    await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
    });

    expect(linkAuthUserToPersonMock).not.toHaveBeenCalled();
  });

  it("clears the setup cookie even if linking throws", async () => {
    createClientMock.mockResolvedValue(authClient());
    loadInvitationByTokenMock.mockRejectedValue(new Error("no service role"));

    const result = await updatePasswordAndFinishAction({
      password: "password1",
      confirm: "password1",
      inviteToken: "tok",
    });

    expect(result).toEqual({});
    expect(cookiesDeleteMock).toHaveBeenCalledWith(PASSWORD_SETUP_COOKIE);
  });
});
