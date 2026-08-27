import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { clubManagerViewer, teamFixture, viewerFixture } from "@/test/fixtures";

const { createClientMock, getViewerContextMock, cookiesGetMock } = vi.hoisted(
  () => ({
    createClientMock: vi.fn(),
    getViewerContextMock: vi.fn(),
    cookiesGetMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGetMock }),
}));

describe("clubs data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("lists visible clubs", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        clubs: okResult([{ id: "club-1", name: "Example FC" }]),
      }),
    );
    const { listVisibleClubs } = await import("@/lib/data/clubs");
    expect((await listVisibleClubs()).data[0]?.id).toBe("club-1");
  });

  it("maps club list errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ clubs: errResult("fail") }),
    );
    const { listVisibleClubs } = await import("@/lib/data/clubs");
    expect(await listVisibleClubs()).toEqual({ data: [], error: "fail" });
  });

  it("resolves a staff club id for managers", async () => {
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    createClientMock.mockResolvedValue(
      mockFromClient({
        clubs: okResult([{ id: "club-1", name: "Example FC" }]),
      }),
    );
    const { resolveStaffClubId } = await import("@/lib/data/clubs");
    expect(await resolveStaffClubId()).toBe("club-1");
  });

  it("returns null for resolveStaffClubId when signed out", async () => {
    getViewerContextMock.mockResolvedValue(null);
    const { resolveStaffClubId } = await import("@/lib/data/clubs");
    expect(await resolveStaffClubId("club-1")).toBeNull();
  });
});

describe("team data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    cookiesGetMock.mockReturnValue(undefined);
  });

  it("returns null active team when none are visible", async () => {
    createClientMock.mockResolvedValue(mockFromClient({ teams: okResult([]) }));
    getViewerContextMock.mockResolvedValue(viewerFixture());
    const { getActiveTeam } = await import("@/lib/data/team");
    expect(await getActiveTeam()).toBeNull();
  });

  it("prefers the cookie team when visible", async () => {
    const teams = [
      teamFixture({ id: "team-a", club_id: "club-1", name: "A" }),
      teamFixture({ id: "team-b", club_id: "club-1", name: "B" }),
    ];
    createClientMock.mockResolvedValue(
      mockFromClient({ teams: okResult(teams) }),
    );
    cookiesGetMock.mockReturnValue({ value: "team-b" });
    const { getActiveTeam } = await import("@/lib/data/team");
    expect((await getActiveTeam())?.id).toBe("team-b");
  });

  it("maps unique team name/season write errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: errResult(
          'duplicate key value violates unique constraint "teams_club_name_season_uidx"',
        ),
      }),
    );
    const { createTeam } = await import("@/lib/data/team");
    const result = await createTeam({
      club_id: "club-1",
      name: "U12 Blues",
      age_group: "U12",
      gender: "mixed",
      season_label: "2025/26",
    });
    expect(result.error).toMatch(/already exists/i);
  });
});
