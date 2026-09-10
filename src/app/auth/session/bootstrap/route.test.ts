import { describe, expect, it, vi } from "vitest";

const { verifySignedInPersonAccessMock, resolveSignedInClubColourHintMock } =
  vi.hoisted(() => ({
    verifySignedInPersonAccessMock: vi.fn(),
    resolveSignedInClubColourHintMock: vi.fn(),
  }));

vi.mock("@/lib/auth/session-access", () => ({
  verifySignedInPersonAccess: verifySignedInPersonAccessMock,
  resolveSignedInClubColourHint: resolveSignedInClubColourHintMock,
}));

import {
  CLUB_COLOUR_LOOKUP_TIMEOUT_MS,
  POST,
} from "@/app/auth/session/bootstrap/route";
import { CLUB_COLOUR_HINT_COOKIE } from "@/lib/clubs/colour-hint";

describe("POST /auth/session/bootstrap", () => {
  it("returns 403 when session access is denied", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({
      error: "Your account does not have access.",
    });

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Your account does not have access.",
    });
    expect(resolveSignedInClubColourHintMock).not.toHaveBeenCalled();
  });

  it("returns 200 and sets a colour hint cookie when available", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });
    resolveSignedInClubColourHintMock.mockResolvedValueOnce("#1B4D3E");

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ error: null });
    expect(response.headers.get("cache-control")).toBe("no-store");
    const cookie = response.cookies.get(CLUB_COLOUR_HINT_COOKIE);
    expect(cookie?.value).toBe("#1B4D3E");
    expect(cookie?.path).toBe("/");
  });

  it("clears the hint cookie when no colour is available", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });
    resolveSignedInClubColourHintMock.mockResolvedValueOnce(null);

    const response = await POST();
    const cookie = response.cookies.get(CLUB_COLOUR_HINT_COOKIE);

    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });

  it("returns 200 without changing hint cookie when colour lookup errors", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });
    resolveSignedInClubColourHintMock.mockRejectedValueOnce(
      new Error("db timeout"),
    );

    const response = await POST();

    expect(response.status).toBe(200);
    expect(response.cookies.get(CLUB_COLOUR_HINT_COOKIE)).toBeUndefined();
  });

  it("returns quickly when colour lookup is too slow", async () => {
    vi.useFakeTimers();
    try {
      verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });
      resolveSignedInClubColourHintMock.mockImplementationOnce(
        () =>
          new Promise<string | null>((resolve) => {
            setTimeout(
              () => resolve("#1B4D3E"),
              CLUB_COLOUR_LOOKUP_TIMEOUT_MS + 50,
            );
          }),
      );

      const responsePromise = POST();
      await vi.advanceTimersByTimeAsync(CLUB_COLOUR_LOOKUP_TIMEOUT_MS + 1);
      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.cookies.get(CLUB_COLOUR_HINT_COOKIE)).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
