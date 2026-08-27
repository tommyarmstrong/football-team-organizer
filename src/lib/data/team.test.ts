import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { teamFixture, viewerFixture } from "@/test/fixtures";
import { SEASON_FORMAT_HINT } from "@/lib/team/season";

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

describe("team data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    cookiesGetMock.mockReturnValue(undefined);
    getViewerContextMock.mockResolvedValue(viewerFixture());
  });

  it("lists visible teams and maps list errors", async () => {
    const teams = [
      teamFixture({ id: "team-b", name: "B", season_label: "2024/25" }),
      teamFixture({ id: "team-a", name: "A", season_label: "2025/26" }),
    ];
    createClientMock.mockResolvedValue(
      mockFromClient({ teams: okResult(teams) }),
    );
    const { listVisibleTeams } = await import("@/lib/data/team");
    const listed = await listVisibleTeams();
    expect(listed.error).toBeNull();
    expect(listed.data.map((t) => t.id)).toEqual(["team-a", "team-b"]);

    createClientMock.mockResolvedValue(
      mockFromClient({ teams: errResult("rls denied") }),
    );
    vi.resetModules();
    const { listVisibleTeams: listAgain } = await import("@/lib/data/team");
    expect(await listAgain()).toEqual({ data: [], error: "rls denied" });
  });

  it("resolves active team from cookie, non-archived fallback, then first team", async () => {
    const archived = teamFixture({
      id: "team-old",
      archived_at: "2025-06-01T00:00:00Z",
      name: "Old",
    });
    const active = teamFixture({ id: "team-new", name: "New" });

    createClientMock.mockResolvedValue(
      mockFromClient({ teams: okResult([archived, active]) }),
    );
    cookiesGetMock.mockReturnValue({ value: "missing-id" });
    const { getActiveTeam, getCurrentTeam } = await import("@/lib/data/team");
    expect((await getActiveTeam())?.id).toBe("team-new");
    expect(getCurrentTeam).toBe(getActiveTeam);

    vi.resetModules();
    createClientMock.mockResolvedValue(
      mockFromClient({ teams: okResult([archived]) }),
    );
    cookiesGetMock.mockReturnValue(undefined);
    const { getActiveTeam: getAgain } = await import("@/lib/data/team");
    expect((await getAgain())?.id).toBe("team-old");
  });

  it("gets, updates, creates, archives, and unarchives teams", async () => {
    const team = teamFixture();
    createClientMock.mockResolvedValue(
      mockFromClient({ teams: okResult(team) }),
    );
    const mod = await import("@/lib/data/team");

    expect(await mod.getTeam("team-1")).toEqual({ data: team, error: null });

    createClientMock.mockResolvedValue(
      mockFromClient({ teams: errResult("not found") }),
    );
    expect(await mod.getTeam("missing")).toEqual({
      data: null,
      error: "not found",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(teamFixture({ name: "Renamed" })),
      }),
    );
    expect(
      (await mod.updateTeam("team-1", { name: "Renamed" })).data?.name,
    ).toBe("Renamed");

    createClientMock.mockResolvedValue(
      mockFromClient({ teams: errResult("update failed") }),
    );
    expect(await mod.updateTeam("team-1", { name: "X" })).toEqual({
      data: null,
      error: "update failed",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(teamFixture({ id: "team-created" })),
      }),
    );
    expect(
      (
        await mod.createTeam({
          club_id: "club-1",
          name: "U12 Blues",
          age_group: "U12",
          gender: "mixed",
          season_label: "2025/26",
        })
      ).data?.id,
    ).toBe("team-created");

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(teamFixture({ archived_at: "2025-08-01T00:00:00Z" })),
      }),
    );
    expect((await mod.archiveTeam("team-1")).data?.archived_at).toBeTruthy();

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(teamFixture({ archived_at: null })),
      }),
    );
    expect((await mod.unarchiveTeam("team-1")).data?.archived_at).toBeNull();
  });

  it("maps unique name/season constraint errors on write", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: errResult(
          'duplicate key value violates unique constraint "teams_club_name_season_uidx"',
        ),
      }),
    );
    const { createTeam, updateTeam } = await import("@/lib/data/team");
    expect(
      (
        await createTeam({
          club_id: "club-1",
          name: "U12 Blues",
          age_group: "U12",
          gender: "mixed",
          season_label: "2025/26",
        })
      ).error,
    ).toMatch(/already exists/i);
    expect((await updateTeam("team-1", { name: "U12 Blues" })).error).toMatch(
      /already exists/i,
    );
  });

  it("validates startNewTeamSeason options before writing", async () => {
    const source = teamFixture({ season_label: "2025/26", name: "U12 Blues" });
    createClientMock.mockResolvedValue(mockFromClient({}));
    const { startNewTeamSeason } = await import("@/lib/data/team");

    expect(await startNewTeamSeason(source, "   ")).toEqual({
      data: null,
      error: "Season is required.",
    });
    expect(await startNewTeamSeason(source, "2025")).toEqual({
      data: null,
      error: SEASON_FORMAT_HINT,
    });
    expect(await startNewTeamSeason(source, "2025/26")).toEqual({
      data: null,
      error: "Enter a new season label that differs from the current season.",
    });
    expect(
      await startNewTeamSeason(source, {
        seasonLabel: "2026/27",
        name: "   ",
      }),
    ).toEqual({ data: null, error: "Team name is required." });
  });

  it("starts a new season with string options and migrates staff/squad", async () => {
    const source = teamFixture({ id: "team-src", season_label: "2025/26" });
    const successor = teamFixture({
      id: "team-next",
      season_label: "2026/27",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: [
          okResult(successor),
          okResult(
            teamFixture({
              id: "team-src",
              archived_at: "2025-08-01T00:00:00Z",
            }),
          ),
        ],
        team_coaches: [
          okResult([{ coach_id: "coach-1", role: "head_coach" }]),
          okResult(null),
        ],
        team_members: [
          okResult([{ user_id: "user-1", role: "coach" }]),
          okResult(null),
        ],
        team_players: [
          okResult([{ player_id: "player-1", shirt_number: 7, active: true }]),
          okResult(null),
        ],
      }),
    );

    const { startNewTeamSeason } = await import("@/lib/data/team");
    const result = await startNewTeamSeason(source, "2026/27");
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("team-next");
  });

  it("skips player/coach migration when disabled and skips archive when already archived", async () => {
    const source = teamFixture({
      id: "team-src",
      season_label: "2025/26",
      archived_at: "2025-01-01T00:00:00Z",
      display_name: "Blues",
    });
    const successor = teamFixture({
      id: "team-next",
      season_label: "2026/27",
      display_name: null,
      age_group: "U13",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(successor),
        team_members: okResult([]),
      }),
    );

    const { startNewTeamSeason } = await import("@/lib/data/team");
    const result = await startNewTeamSeason(source, {
      seasonLabel: "2026/27",
      name: "U13 Blues",
      displayName: "  ",
      ageGroup: "U13",
      migratePlayers: false,
      migrateCoaches: false,
    });
    expect(result).toEqual({ data: successor, error: null });
  });

  it("returns create and migration errors from startNewTeamSeason", async () => {
    const source = teamFixture({ season_label: "2025/26" });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: errResult("create failed"),
      }),
    );
    const { startNewTeamSeason } = await import("@/lib/data/team");
    expect(await startNewTeamSeason(source, "2026/27")).toEqual({
      data: null,
      error: "create failed",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(null),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startAgain } = await import("@/lib/data/team");
    expect(await startAgain(source, "2026/27")).toEqual({
      data: null,
      error: "Could not create team.",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(
          teamFixture({ id: "team-next", season_label: "2026/27" }),
        ),
        team_coaches: errResult("coaches boom"),
        team_members: okResult([]),
        team_players: okResult([]),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startCoaches } =
      await import("@/lib/data/team");
    expect(await startCoaches(source, "2026/27")).toEqual({
      data: null,
      error: "coaches boom",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(
          teamFixture({ id: "team-next", season_label: "2026/27" }),
        ),
        team_coaches: okResult([]),
        team_members: errResult("members boom"),
        team_players: okResult([]),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startMembers } =
      await import("@/lib/data/team");
    expect(await startMembers(source, "2026/27")).toEqual({
      data: null,
      error: "members boom",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(
          teamFixture({ id: "team-next", season_label: "2026/27" }),
        ),
        team_coaches: okResult([]),
        team_members: okResult([]),
        team_players: errResult("players boom"),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startPlayers } =
      await import("@/lib/data/team");
    expect(await startPlayers(source, "2026/27")).toEqual({
      data: null,
      error: "players boom",
    });
  });

  it("returns insert and archive errors during season migration", async () => {
    const source = teamFixture({ id: "team-src", season_label: "2025/26" });
    const successor = teamFixture({
      id: "team-next",
      season_label: "2026/27",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(successor),
        team_coaches: [
          okResult([{ coach_id: "c1", role: "assistant" }]),
          errResult("insert coaches failed"),
        ],
        team_members: okResult([]),
        team_players: okResult([]),
      }),
    );
    const { startNewTeamSeason } = await import("@/lib/data/team");
    expect(await startNewTeamSeason(source, "2026/27")).toEqual({
      data: null,
      error: "insert coaches failed",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(successor),
        team_coaches: okResult([]),
        team_members: [
          okResult([{ user_id: "u1", role: "management" }]),
          errResult("insert members failed"),
        ],
        team_players: okResult([]),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startMembers } =
      await import("@/lib/data/team");
    expect(await startMembers(source, "2026/27")).toEqual({
      data: null,
      error: "insert members failed",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(successor),
        team_coaches: okResult([]),
        team_members: okResult([]),
        team_players: [
          okResult([{ player_id: "p1", shirt_number: null, active: true }]),
          errResult("insert players failed"),
        ],
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startPlayers } =
      await import("@/lib/data/team");
    expect(await startPlayers(source, "2026/27")).toEqual({
      data: null,
      error: "insert players failed",
    });

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: [okResult(successor), errResult("archive failed")],
        team_coaches: okResult([]),
        team_members: okResult([]),
        team_players: okResult([]),
      }),
    );
    vi.resetModules();
    const { startNewTeamSeason: startArchive } =
      await import("@/lib/data/team");
    expect(await startArchive(source, "2026/27")).toEqual({
      data: null,
      error: "archive failed",
    });
  });

  it("checks canEditActiveTeam and canEditActiveMatchDay", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult([teamFixture({ id: "team-1" })]),
      }),
    );
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: ["team-1"] }),
    );
    const { canEditActiveTeam, canEditActiveMatchDay } =
      await import("@/lib/data/team");
    expect(await canEditActiveTeam()).toBe(true);
    expect(await canEditActiveMatchDay()).toBe(true);

    getViewerContextMock.mockResolvedValue(null);
    vi.resetModules();
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult([teamFixture({ id: "team-1" })]),
      }),
    );
    const {
      canEditActiveTeam: canEditTeamAgain,
      canEditActiveMatchDay: canEditMatchAgain,
    } = await import("@/lib/data/team");
    expect(await canEditTeamAgain()).toBe(false);
    expect(await canEditMatchAgain()).toBe(false);

    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: ["other"] }),
    );
    createClientMock.mockResolvedValue(mockFromClient({ teams: okResult([]) }));
    vi.resetModules();
    const { canEditActiveTeam: noTeam } = await import("@/lib/data/team");
    expect(await noTeam()).toBe(false);
  });

  it("treats archived active teams as match-day read-only", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult([
          teamFixture({ id: "team-1", archived_at: "2026-05-01T00:00:00Z" }),
        ]),
      }),
    );
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: ["team-1"] }),
    );
    vi.resetModules();
    const { canEditActiveMatchDay, canEditActiveTeamHistory, getTeam } =
      await import("@/lib/data/team");
    expect(await canEditActiveMatchDay()).toBe(false);
    expect(await canEditActiveTeamHistory()).toBe(false);

    createClientMock.mockResolvedValue(
      mockFromClient({
        teams: okResult(teamFixture({ archived_at: "2026-05-01T00:00:00Z" })),
      }),
    );
    expect(await getTeam("team-1")).toMatchObject({
      data: { archived_at: "2026-05-01T00:00:00Z" },
    });
  });
});
