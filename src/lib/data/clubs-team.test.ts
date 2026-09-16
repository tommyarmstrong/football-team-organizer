import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import {
  clubFixture,
  clubManagerViewer,
  teamFixture,
  viewerFixture,
} from "@/test/fixtures";

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
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createClientMock(),
}));
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends unknown[], R>(fn: (...args: T) => Promise<R>) =>
    (...args: T) =>
      fn(...args),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
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
    createClientMock.mockReturnValue(
      mockFromClient({
        clubs: okResult([{ id: "club-1", name: "Example FC" }]),
      }),
    );
    const { listVisibleClubs, CLUB_SUMMARY_SELECT } =
      await import("@/lib/data/clubs");
    expect(CLUB_SUMMARY_SELECT).toBe("id, name, colour, icon_url");
    expect(CLUB_SUMMARY_SELECT).not.toMatch(/about|website|email|phone/);
    expect((await listVisibleClubs()).data[0]?.id).toBe("club-1");
  });

  it("maps club list errors", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ clubs: errResult("fail") }),
    );
    const { listVisibleClubs } = await import("@/lib/data/clubs");
    expect(await listVisibleClubs()).toEqual({ data: [], error: "fail" });
  });

  it("gets a club by id and maps errors", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({
        clubs: okResult({ id: "club-1", name: "Example FC" }),
      }),
    );
    const { getClub } = await import("@/lib/data/clubs");
    expect((await getClub("club-1")).data?.id).toBe("club-1");

    createClientMock.mockReturnValue(
      mockFromClient({ clubs: errResult("missing") }),
    );
    expect(await getClub("club-x")).toEqual({ data: null, error: "missing" });
  });

  it("resolves primary club from preferred ids in ctx.visibleClubs", async () => {
    // §4.1 + §6.2 — getPrimaryClub() now reads clubs from ctx.visibleClubs
    // returned by the composite get_viewer_context() RPC; no extra DB call.
    getViewerContextMock.mockResolvedValue(
      clubManagerViewer({
        managementClubIds: ["club-hidden"],
        visibleTeams: [teamFixture({ club_id: "club-1" })],
        visibleClubs: [
          clubFixture({ id: "club-1", name: "Visible FC" }),
          clubFixture({ id: "club-hidden", name: "Hidden FC" }),
        ],
      }),
    );
    const { getPrimaryClub } = await import("@/lib/data/clubs");
    // Prefers management club ("club-hidden") over team club ("club-1").
    expect((await getPrimaryClub())?.id).toBe("club-hidden");

    // When ctx is null, no clubs are accessible → returns null.
    getViewerContextMock.mockResolvedValue(null);
    vi.resetModules();
    const { getPrimaryClub: getPrimaryNoCtx } =
      await import("@/lib/data/clubs");
    expect(await getPrimaryNoCtx()).toBeNull();

    // When ctx exists but visibleClubs is empty → returns null.
    getViewerContextMock.mockResolvedValue(
      clubManagerViewer({ visibleClubs: [] }),
    );
    vi.resetModules();
    const { getPrimaryClub: getPrimaryEmpty } =
      await import("@/lib/data/clubs");
    expect(await getPrimaryEmpty()).toBeNull();
  });

  it("falls back to first visible club when no preferred id matches", async () => {
    getViewerContextMock.mockResolvedValue(
      clubManagerViewer({
        managementClubIds: [],
        visibleTeams: [],
        visibleClubs: [clubFixture({ id: "club-only", name: "Only FC" })],
      }),
    );
    vi.resetModules();
    const { getPrimaryClub } = await import("@/lib/data/clubs");
    expect((await getPrimaryClub())?.id).toBe("club-only");
  });

  it("creates and updates clubs", async () => {
    createClientMock.mockReturnValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            create_club_with_management: okResult({
              id: "club-new",
              name: "New FC",
            }),
          },
        },
      ),
    );
    const { createClub, updateClub } = await import("@/lib/data/clubs");
    expect((await createClub("New FC")).data?.id).toBe("club-new");

    createClientMock.mockReturnValue(
      mockFromClient(
        {},
        {
          rpcResults: {
            create_club_with_management: errResult("rpc failed"),
          },
        },
      ),
    );
    expect(await createClub("X")).toEqual({
      data: null,
      error: "rpc failed",
    });

    createClientMock.mockReturnValue(
      mockFromClient({
        clubs: okResult({ id: "club-1", name: "Updated" }),
      }),
    );
    expect((await updateClub("club-1", { name: "Updated" })).data?.name).toBe(
      "Updated",
    );

    createClientMock.mockReturnValue(
      mockFromClient({ clubs: errResult("update failed") }),
    );
    expect(await updateClub("club-1", { name: "X" })).toEqual({
      data: null,
      error: "update failed",
    });
  });

  it("resolves a staff club id for managers", async () => {
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    createClientMock.mockReturnValue(
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

  it("returns null active team when ctx has no visible teams", async () => {
    // §4.1 + §6.2 — getActiveTeam() now reads teams from ctx.visibleTeams;
    // createClientMock is no longer consulted for teams.
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ visibleTeams: [], editableTeamIds: [] }),
    );
    const { getActiveTeam } = await import("@/lib/data/team");
    expect(await getActiveTeam()).toBeNull();
  });

  it("prefers the cookie team when it is visible in the context", async () => {
    const teams = [
      teamFixture({ id: "team-a", club_id: "club-1", name: "A" }),
      teamFixture({ id: "team-b", club_id: "club-1", name: "B" }),
    ];
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ visibleTeams: teams }),
    );
    cookiesGetMock.mockReturnValue({ value: "team-b" });
    const { getActiveTeam } = await import("@/lib/data/team");
    expect((await getActiveTeam())?.id).toBe("team-b");
  });

  it("maps unique team name/season write errors", async () => {
    createClientMock.mockReturnValue(
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
