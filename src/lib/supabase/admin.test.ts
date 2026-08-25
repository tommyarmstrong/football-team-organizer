import { afterEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({ kind: "admin-client" })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { createAdminClient } from "@/lib/supabase/admin";

describe("createAdminClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    createClientMock.mockClear();
  });

  it("throws when the service role key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => createAdminClient()).toThrow(
      /SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY/,
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws when the project URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");
    expect(() => createAdminClient()).toThrow(
      /SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY/,
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("creates a client with the service role key and no browser session", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");

    expect(createAdminClient()).toEqual({ kind: "admin-client" });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-secret",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  });
});
