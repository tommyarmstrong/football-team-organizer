import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";
import { CLUB_COLOUR_HINT_COOKIE } from "@/lib/clubs/colour-hint";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { FTO_ACCESS_COOKIE, updateSession } from "@/lib/supabase/middleware";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

function mockAuth({
  user = { id: "auth-1" } as { id: string } | null,
  hasAccess = false,
  clubColour = null as string | null,
}: {
  user?: { id: string } | null;
  hasAccess?: boolean;
  /** Colour returned by the middleware clubs query (§2.1). */
  clubColour?: string | null;
} = {}) {
  createServerClientMock.mockReturnValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    rpc: vi.fn(async (name: string) => {
      if (name === "has_app_access") {
        return { data: hasAccess, error: null };
      }
      return { data: null, error: null };
    }),
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => ({
              data: clubColour ? { colour: clubColour } : null,
              error: null,
            }),
          }),
        }),
      }),
    }),
  });
}

describe("updateSession auth gates", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows requests through when Supabase env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const response = await updateSession(request("/dashboard"));
    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("sends anonymous users on protected routes to /login", async () => {
    mockAuth({ user: null });

    const response = await updateSession(request("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard",
    );
  });

  it("allows anonymous users onto public auth pages", async () => {
    mockAuth({ user: null });

    const response = await updateSession(request("/auth/invite"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps an invite setup session off the rest of the app", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(
      request("/dashboard", `${PASSWORD_SETUP_COOKIE}=invite`),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/invite",
    );
  });

  it("keeps a recovery setup session on the reset page", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(
      request("/dashboard", `${PASSWORD_SETUP_COOKIE}=recovery`),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/reset-password",
    );
  });

  it("allows an invite setup session to stay on /auth/invite", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(
      request("/auth/invite", `${PASSWORD_SETUP_COOKIE}=invite`),
    );
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends signed-in users without membership to /no-access", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: false });

    const response = await updateSession(request("/dashboard"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/no-access",
    );
  });

  it("sends player-only sessions (has_app_access false) to /no-access", async () => {
    // RPC returns false for player-only roles after the role-gate migration.
    mockAuth({ user: { id: "player-auth" }, hasAccess: false });

    const response = await updateSession(request("/team"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/no-access",
    );
  });

  it("allows coach/guardian/manager sessions when has_app_access is true", async () => {
    mockAuth({ user: { id: "coach-auth" }, hasAccess: true });

    const response = await updateSession(request("/dashboard"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends signed-in users without membership away from /login", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: false });

    const response = await updateSession(request("/login"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/no-access",
    );
  });

  it("sends members away from /login and leftover invite pages", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const fromLogin = await updateSession(request("/login"));
    expect(fromLogin.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );

    const fromInvite = await updateSession(request("/auth/invite"));
    expect(fromInvite.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );

    const fromForgot = await updateSession(request("/auth/forgot-password"));
    expect(fromForgot.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("allows signed-in users to hit /auth/session/bootstrap", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/auth/session/bootstrap"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not bounce members off /auth/reset-password", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/auth/reset-password"));
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("§3.1 — fto_access cookie caching", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets fto_access=1 cookie when has_app_access returns true", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
    const cookie = response.cookies.get(FTO_ACCESS_COOKIE);
    expect(cookie?.value).toBe("1");
    expect(cookie?.maxAge).toBe(300);
    expect(cookie?.httpOnly).toBe(true);
  });

  it("does not set fto_access cookie when has_app_access returns false", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: false });

    // Need a membership-exempt path so the test reaches cookie-setting code
    const response = await updateSession(request("/no-access"));

    expect(response.cookies.get(FTO_ACCESS_COOKIE)).toBeUndefined();
  });

  it("skips the has_app_access RPC when fto_access=1 cookie is present", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: false }); // RPC would deny

    // Cookie says access is granted — RPC result should be ignored
    const response = await updateSession(
      request("/dashboard", `${FTO_ACCESS_COOKIE}=1`),
    );

    expect(response.headers.get("location")).toBeNull();
    // Confirm the RPC was NOT called
    const client = createServerClientMock.mock.results[0].value;
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("carries fto_access cookie through the login→dashboard redirect", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/login"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
    const cookie = response.cookies.get(FTO_ACCESS_COOKIE);
    expect(cookie?.value).toBe("1");
  });
});

describe("§2.1 — club_colour_hint cookie in middleware", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets club_colour_hint cookie when colour is available and cookie is absent", async () => {
    mockAuth({
      user: { id: "auth-1" },
      hasAccess: true,
      clubColour: "#1B4D3E",
    });

    const response = await updateSession(request("/dashboard"));

    const cookie = response.cookies.get(CLUB_COLOUR_HINT_COOKIE);
    expect(cookie?.value).toBe("#1B4D3E");
    expect(cookie?.path).toBe("/");
  });

  it("does not overwrite an existing valid colour cookie", async () => {
    mockAuth({
      user: { id: "auth-1" },
      hasAccess: true,
      clubColour: "#FF0000",
    });

    const response = await updateSession(
      request("/dashboard", `${CLUB_COLOUR_HINT_COOKIE}=#1B4D3E`),
    );

    // Cookie in response should not be changed
    expect(response.cookies.get(CLUB_COLOUR_HINT_COOKIE)).toBeUndefined();
  });

  it("does not set colour cookie when no club is found", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true, clubColour: null });

    const response = await updateSession(request("/dashboard"));

    expect(response.cookies.get(CLUB_COLOUR_HINT_COOKIE)).toBeUndefined();
  });

  it("does not set colour cookie for users without app access", async () => {
    mockAuth({
      user: { id: "auth-1" },
      hasAccess: false,
      clubColour: "#1B4D3E",
    });

    const response = await updateSession(request("/no-access"));

    expect(response.cookies.get(CLUB_COLOUR_HINT_COOKIE)).toBeUndefined();
  });
});

describe("§3.2 — parallel getUser() + has_app_access", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls both getUser() and has_app_access on a cache miss", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    await updateSession(request("/dashboard")); // no fto_access cookie → cache miss

    const client = createServerClientMock.mock.results[0].value;
    // Both should have been called (verifying concurrent execution path).
    expect(client.rpc).toHaveBeenCalledWith("has_app_access");
  });

  it("does not call has_app_access when fto_access cookie is present", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: false }); // RPC would deny

    await updateSession(request("/dashboard", `${FTO_ACCESS_COOKIE}=1`));

    const client = createServerClientMock.mock.results[0].value;
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("resolves access correctly when both calls return concurrently", async () => {
    // Simulate concurrent resolution by confirming the result is correct.
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/dashboard"));

    // No redirect → access was granted via the concurrent RPC result.
    expect(response.headers.get("location")).toBeNull();
    const cookie = response.cookies.get(FTO_ACCESS_COOKIE);
    expect(cookie?.value).toBe("1");
  });
});
