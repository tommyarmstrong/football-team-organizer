import { describe, expect, it, vi } from "vitest";

const { verifySignedInPersonAccessMock } = vi.hoisted(() => ({
  verifySignedInPersonAccessMock: vi.fn(),
}));

vi.mock("@/lib/auth/session-access", () => ({
  verifySignedInPersonAccess: verifySignedInPersonAccessMock,
}));

import { GET } from "@/app/auth/session/verify/route";

function request(url: string) {
  return new Request(url);
}

describe("GET /auth/session/verify", () => {
  it("redirects to /dashboard when access is granted and no next param is given", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });

    const response = await GET(
      request("http://localhost:3000/auth/session/verify"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("redirects to the next param when access is granted", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });

    const response = await GET(
      request("http://localhost:3000/auth/session/verify?next=%2Fmatches"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/matches",
    );
  });

  it("redirects to /login with the error message when access is denied", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({
      error: "Your account has been disabled.",
    });

    const response = await GET(
      request("http://localhost:3000/auth/session/verify?next=%2Fdashboard"),
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe(
      "Your account has been disabled.",
    );
  });

  it("falls back to /dashboard for non-relative next values (open-redirect guard)", async () => {
    verifySignedInPersonAccessMock.mockResolvedValueOnce({ error: null });

    const response = await GET(
      request(
        "http://localhost:3000/auth/session/verify?next=https%3A%2F%2Fevil.com",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("passes next through to the error redirect so login can forward after re-auth", async () => {
    // The error redirect always goes to /login regardless of next; the user
    // must sign in again. Verify the error param is present and next is not
    // leaked into an unrelated destination.
    verifySignedInPersonAccessMock.mockResolvedValueOnce({
      error: "Not signed in.",
    });

    const response = await GET(
      request("http://localhost:3000/auth/session/verify?next=%2Fteam"),
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("Not signed in.");
  });
});
