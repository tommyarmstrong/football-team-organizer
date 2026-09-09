import { describe, expect, it, vi } from "vitest";

const { verifySignedInPersonAccessMock } = vi.hoisted(() => ({
  verifySignedInPersonAccessMock: vi.fn(),
}));

vi.mock("@/lib/auth/session-access", () => ({
  verifySignedInPersonAccess: verifySignedInPersonAccessMock,
}));

import { POST } from "@/app/auth/session/verify/route";

describe("POST /auth/session/verify", () => {
  it("returns 200 when the signed-in person is allowed", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ error: null });
  });

  it("returns 403 with a message when access is denied", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({
      error: "Your account does not have access.",
    });

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Your account does not have access.",
    });
  });
});
