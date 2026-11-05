import { beforeEach, describe, expect, it, vi } from "vitest";
import { clubFixture, teamFixture, viewerFixture } from "@/test/fixtures";

const {
  getViewerContextMock,
  getCoachMock,
  getCoachTeamsMock,
  getClubMock,
  getAllTeamStatsMock,
  getActiveTeamMock,
} = vi.hoisted(() => ({
  getViewerContextMock: vi.fn(),
  getCoachMock: vi.fn(),
  getCoachTeamsMock: vi.fn(),
  getClubMock: vi.fn(),
  getAllTeamStatsMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
}));

vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/coaches", () => ({
  getCoach: getCoachMock,
  getCoachTeams: getCoachTeamsMock,
}));
vi.mock("@/lib/data/clubs", () => ({ getClub: getClubMock }));
vi.mock("@/lib/data/stats", () => ({ getAllTeamStats: getAllTeamStatsMock }));
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));

import { buildCoachCardPayload } from "@/lib/postcards/coach-card";

const coach = {
  id: "coach-1",
  person_id: "person-1",
  club_id: "club-1",
  active_role: true,
  first_name: "Grace",
  last_name: "Hopper",
};

const result = (
  letter: "W" | "D" | "L",
  goalsFor: number,
  goalsAgainst: number,
  isFriendly = false,
) => ({ result: letter, goalsFor, goalsAgainst, isFriendly });

// The friendly must not count towards the card.
const stats = {
  resultsOverTime: [
    result("W", 3, 1),
    result("W", 2, 0),
    result("D", 1, 1),
    result("L", 0, 2),
    result("W", 8, 0, true),
  ],
  error: null,
};

const membership = (teamId: string, extra: Record<string, unknown> = {}) => ({
  team_coach_id: `tc-${teamId}`,
  team_id: teamId,
  team_name: teamId,
  team_season_label: "2025/26",
  role: "Head Coach",
  ...extra,
});

function coachViewer(
  teams = [teamFixture({ id: "team-1" })],
  overrides: Parameters<typeof viewerFixture>[0] = {},
) {
  return viewerFixture({
    coachTeamIds: [],
    editableTeamIds: [],
    memberTeamRoles: {},
    personId: "person-1",
    visibleTeams: teams,
    ...overrides,
  });
}

describe("buildCoachCardPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(coachViewer());
    getCoachMock.mockResolvedValue({ data: coach, error: null });
    getCoachTeamsMock.mockResolvedValue({
      data: [membership("team-1")],
      error: null,
    });
    getClubMock.mockResolvedValue({
      data: clubFixture({
        name: "Mill Green",
        colour: "#1B4D8E",
        icon_url: "https://cdn.example/crest.png",
      }),
      error: null,
    });
    getAllTeamStatsMock.mockResolvedValue(stats);
    getActiveTeamMock.mockResolvedValue(null);
  });

  it("builds a card for the coach with the team's competitive record", async () => {
    const { data, error } = await buildCoachCardPayload("coach-1");

    expect(error).toBeNull();
    expect(getAllTeamStatsMock).toHaveBeenCalledWith("team-1");
    expect(data).toMatchObject({
      coachId: "coach-1",
      teamId: "team-1",
      clubName: "Mill Green",
      clubColour: "#1B4D8E",
      clubIconUrl: "https://cdn.example/crest.png",
      teamName: "U12 Blues",
      ageGroup: "U12",
      seasonLabel: "2025/26",
      firstName: "Grace",
      lastName: "Hopper",
      roleLabel: "Head Coach",
      stats: {
        played: 4,
        wins: 2,
        draws: 1,
        losses: 1,
        goalsFor: 6,
        goalsAgainst: 4,
      },
      fileName: "grace-hopper-u12-blues-2025-26-coach-card.png",
    });
    expect(data?.caption).toContain("Grace Hopper · Head Coach");
  });

  it("labels a coach with no recorded role", async () => {
    getCoachTeamsMock.mockResolvedValue({
      data: [membership("team-1", { role: null })],
      error: null,
    });
    expect((await buildCoachCardPayload("coach-1")).data?.roleLabel).toBe(
      "Coach",
    );
  });

  it("drops an invalid club colour and tolerates a missing club", async () => {
    getClubMock.mockResolvedValue({
      data: clubFixture({ colour: "green" }),
      error: null,
    });
    expect((await buildCoachCardPayload("coach-1")).data?.clubColour).toBe(
      null,
    );

    getClubMock.mockResolvedValue({ data: null, error: null });
    expect((await buildCoachCardPayload("coach-1")).data).toMatchObject({
      clubName: "",
      clubColour: null,
      clubIconUrl: null,
    });
  });

  it("allows club managers and coaches or managers of the team", async () => {
    for (const viewer of [
      viewerFixture({
        personId: "someone-else",
        managementClubIds: ["club-1"],
        coachTeamIds: [],
        visibleTeams: [teamFixture({ id: "team-1" })],
      }),
      viewerFixture({
        personId: "someone-else",
        visibleTeams: [teamFixture({ id: "team-1" })],
      }),
      viewerFixture({
        personId: "someone-else",
        coachTeamIds: [],
        managementTeamIds: ["team-1"],
        visibleTeams: [teamFixture({ id: "team-1" })],
      }),
    ]) {
      getViewerContextMock.mockResolvedValue(viewer);
      const { data } = await buildCoachCardPayload("coach-1");
      expect(data?.teamId).toBe("team-1");
    }
  });

  it.each([
    [
      "a guardian on the team",
      viewerFixture({
        personId: "someone-else",
        coachTeamIds: [],
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian"] },
        guardianPlayerIds: ["player-1"],
      }),
    ],
    [
      "a guardian assistant",
      viewerFixture({
        personId: "someone-else",
        coachTeamIds: [],
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian_assistant"] },
      }),
    ],
    [
      "a coach of another team",
      viewerFixture({
        personId: "someone-else",
        coachTeamIds: ["team-2"],
        editableTeamIds: ["team-2"],
      }),
    ],
    [
      "a manager of another club",
      viewerFixture({
        personId: "someone-else",
        managementClubIds: ["c-2"],
        coachTeamIds: [],
      }),
    ],
  ])("returns nothing for %s", async (_label, viewer) => {
    getViewerContextMock.mockResolvedValue(viewer);
    const result = await buildCoachCardPayload("coach-1");
    expect(result).toEqual({ data: null, error: null });
    expect(getAllTeamStatsMock).not.toHaveBeenCalled();
  });

  it("returns nothing when signed out", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await buildCoachCardPayload("coach-1")).toEqual({
      data: null,
      error: null,
    });
    expect(getCoachMock).not.toHaveBeenCalled();
  });

  it("returns nothing for an unknown, inactive, or mismatched coach", async () => {
    getCoachMock.mockResolvedValue({ data: null, error: null });
    expect(await buildCoachCardPayload("coach-1")).toEqual({
      data: null,
      error: null,
    });

    getCoachMock.mockResolvedValue({
      data: { ...coach, active_role: false },
      error: null,
    });
    expect((await buildCoachCardPayload("coach-1")).data).toBeNull();

    getCoachMock.mockResolvedValue({ data: coach, error: null });
    expect(
      (await buildCoachCardPayload("coach-1", { personId: "someone-else" }))
        .data,
    ).toBeNull();
    expect(
      (await buildCoachCardPayload("coach-1", { personId: "person-1" })).data,
    ).not.toBeNull();
  });

  it("returns nothing when the coach is on no visible team", async () => {
    getCoachTeamsMock.mockResolvedValue({ data: [], error: null });
    expect((await buildCoachCardPayload("coach-1")).data).toBeNull();

    getCoachTeamsMock.mockResolvedValue({
      data: [membership("team-hidden")],
      error: null,
    });
    expect((await buildCoachCardPayload("coach-1")).data).toBeNull();
  });

  it("returns nothing for a team in a different club than the coach", async () => {
    getViewerContextMock.mockResolvedValue(
      coachViewer([teamFixture({ id: "team-1", club_id: "club-2" })]),
    );
    expect((await buildCoachCardPayload("coach-1")).data).toBeNull();
  });

  describe("with several teams", () => {
    const teams = [
      teamFixture({ id: "team-1", name: "U11 Blues" }),
      teamFixture({ id: "team-2", name: "U12 Reds" }),
    ];

    beforeEach(() => {
      getViewerContextMock.mockResolvedValue(coachViewer(teams));
      getCoachTeamsMock.mockResolvedValue({
        data: [
          membership("team-1", { role: "Assistant Coach" }),
          membership("team-2"),
        ],
        error: null,
      });
    });

    it("uses the viewer's active team when the coach is on it", async () => {
      getActiveTeamMock.mockResolvedValue(teams[1]);
      expect(await buildCoachCardPayload("coach-1")).toMatchObject({
        data: { teamId: "team-2", roleLabel: "Head Coach" },
      });
    });

    it("uses an explicitly requested team and that team's role", async () => {
      const { data } = await buildCoachCardPayload("coach-1", {
        teamId: "team-1",
      });
      expect(data).toMatchObject({
        teamId: "team-1",
        roleLabel: "Assistant Coach",
      });
    });

    it("rejects a requested team the coach is not on", async () => {
      const result = await buildCoachCardPayload("coach-1", {
        teamId: "team-9",
      });
      expect(result).toEqual({ data: null, error: null });
    });

    it("only offers teams the viewer coaches", async () => {
      getViewerContextMock.mockResolvedValue(
        coachViewer(teams, {
          personId: "someone-else",
          coachTeamIds: ["team-1"],
        }),
      );
      expect((await buildCoachCardPayload("coach-1")).data?.teamId).toBe(
        "team-1",
      );
      expect(
        (await buildCoachCardPayload("coach-1", { teamId: "team-2" })).data,
      ).toBeNull();
    });
  });

  it("surfaces load failures", async () => {
    getCoachMock.mockResolvedValue({ data: null, error: "coach failed" });
    expect(await buildCoachCardPayload("coach-1")).toEqual({
      data: null,
      error: "coach failed",
    });

    getCoachMock.mockResolvedValue({ data: coach, error: null });
    getCoachTeamsMock.mockResolvedValue({ data: [], error: "teams failed" });
    expect((await buildCoachCardPayload("coach-1")).error).toBe("teams failed");

    getCoachTeamsMock.mockResolvedValue({
      data: [membership("team-1")],
      error: null,
    });
    getAllTeamStatsMock.mockResolvedValue({ ...stats, error: "stats failed" });
    expect(await buildCoachCardPayload("coach-1")).toEqual({
      data: null,
      error: "stats failed",
    });
  });
});
