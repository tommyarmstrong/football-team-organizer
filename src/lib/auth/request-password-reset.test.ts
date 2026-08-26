import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, resetPasswordForEmailMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { requestPasswordResetEmail } from "@/lib/auth/request-password-reset";

describe("requestPasswordResetEmail", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    resetPasswordForEmailMock.mockReset();
    createClientMock.mockReturnValue({
      auth: { resetPasswordForEmail: resetPasswordForEmailMock },
    });
    resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });
    vi.stubGlobal("window", {
      location: { origin: "https://tracker.example.com" },
    });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects a blank email without calling Supabase", async () => {
    const result = await requestPasswordResetEmail("  ");
    expect(result).toEqual({ error: "Enter your email address." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requests recovery with the implicit Auth flow (no PKCE verifier)", async () => {
    const result = await requestPasswordResetEmail(" ada@example.com ");

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({
        auth: expect.objectContaining({ flowType: "implicit" }),
      }),
    );
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("ada@example.com", {
      redirectTo: "https://tracker.example.com/auth/reset-password",
    });
    expect(result.success).toMatch(/password reset link/i);
    expect(result.error).toBeUndefined();
  });

  it("returns the Supabase error when sending fails", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });

    const result = await requestPasswordResetEmail("ada@example.com");
    expect(result).toEqual({ error: "rate limited" });
  });
});
