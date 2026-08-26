import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { updateSession } from "@/lib/supabase/middleware";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

function mockAuth({
  user = { id: "auth-1" } as { id: string } | null,
  hasAccess = false,
}: {
  user?: { id: string } | null;
  hasAccess?: boolean;
} = {}) {
  createServerClientMock.mockReturnValue({
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    rpc: async (name: string) => {
      if (name === "has_app_access") {
        return { data: hasAccess, error: null };
      }
      return { data: null, error: null };
    },
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

  it("does not bounce members off /auth/reset-password", async () => {
    mockAuth({ user: { id: "auth-1" }, hasAccess: true });

    const response = await updateSession(request("/auth/reset-password"));
    expect(response.headers.get("location")).toBeNull();
  });
});
