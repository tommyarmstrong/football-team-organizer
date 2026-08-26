import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, resetPasswordForEmailMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a blank email without calling Supabase", async () => {
    const result = await requestPasswordResetEmail("  ");
    expect(result).toEqual({ error: "Enter your email address." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("sends a reset email that returns to /auth/reset-password", async () => {
    const result = await requestPasswordResetEmail(" ada@example.com ");

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
