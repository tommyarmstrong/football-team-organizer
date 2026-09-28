import { beforeEach, describe, expect, it, vi } from "vitest";
import { clubFixture, teamFixture, viewerFixture } from "@/test/fixtures";

const {
  getViewerContextMock,
  getPlayerMock,
  getPlayerTeamsMock,
  getClubMock,
  getAllTeamStatsMock,
  getActiveTeamMock,
} = vi.hoisted(() => ({
  getViewerContextMock: vi.fn(),
  getPlayerMock: vi.fn(),
  getPlayerTeamsMock: vi.fn(),
  getClubMock: vi.fn(),
  getAllTeamStatsMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
}));

vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/players", () => ({
  getPlayer: getPlayerMock,
  getPlayerTeams: getPlayerTeamsMock,
}));
vi.mock("@/lib/data/clubs", () => ({ getClub: getClubMock }));
vi.mock("@/lib/data/stats", () => ({ getAllTeamStats: getAllTeamStatsMock }));
vi.mock("@/lib/data/team", () => ({ getActiveTeam: getActiveTeamMock }));

import { buildPlayerCardPayload } from "@/lib/postcards/player-card";

const player = {
  id: "player-1",
  person_id: "person-1",
  club_id: "club-1",
  active_role: true,
  position: "FWD",
  first_name: "Maya",
  last_name: "Hall",
};

const stats = {
  goalsByPlayer: [
    { playerId: "player-1", goals: 9 },
    { playerId: "player-2", goals: 3 },
  ],
  assistsByPlayer: [{ playerId: "player-1", count: 4 }],
  potmByPlayer: [{ playerId: "player-1", count: 2 }],
  matchesPlayed: [
    { playerId: "player-1", count: 14 },
    { playerId: "player-2", count: 10 },
  ],
  error: null,
};

const membership = (teamId: string, extra: Record<string, unknown> = {}) => ({
  team_player_id: `tp-${teamId}`,
  team_id: teamId,
  team_name: teamId,
  shirt_number: 7,
  active: true,
  ...extra,
});

function guardianViewer(teams = [teamFixture({ id: "team-1" })]) {
  return viewerFixture({
    coachTeamIds: [],
    editableTeamIds: [],
    memberTeamRoles: {},
    guardianPlayerIds: ["player-1"],
    guardianIds: ["g-1"],
    visibleTeams: teams,
  });
}

describe("buildPlayerCardPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(guardianViewer());
    getPlayerMock.mockResolvedValue({ data: player, error: null });
    getPlayerTeamsMock.mockResolvedValue({
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

  it("builds a card for a guardian with the player's team stats", async () => {
    const { data, error } = await buildPlayerCardPayload("player-1");

    expect(error).toBeNull();
    expect(getAllTeamStatsMock).toHaveBeenCalledWith("team-1");
    expect(data).toMatchObject({
      playerId: "player-1",
      teamId: "team-1",
      clubName: "Mill Green",
      clubColour: "#1B4D8E",
      clubIconUrl: "https://cdn.example/crest.png",
      teamName: "U12 Blues",
      ageGroup: "U12",
      seasonLabel: "2025/26",
      firstName: "Maya",
      lastName: null,
      shirtNumber: 7,
      positionLabel: "Forward",
      stats: { appearances: 14, goals: 9, assists: 4, potm: 2 },
      fileName: "maya-u12-blues-2025-26-player-card.png",
    });
    expect(data?.caption).toContain("Maya 7 · Forward");
    expect(data?.caption).not.toContain("Hall");
  });

  it("zeroes stats for a player with no recorded activity", async () => {
    getAllTeamStatsMock.mockResolvedValue({
      ...stats,
      goalsByPlayer: [],
      assistsByPlayer: [],
      potmByPlayer: [],
      matchesPlayed: [],
    });
    const { data } = await buildPlayerCardPayload("player-1");
    expect(data?.stats).toEqual({
      appearances: 0,
      goals: 0,
      assists: 0,
      potm: 0,
    });
  });

  it("shows the surname on adult teams", async () => {
    getViewerContextMock.mockResolvedValue(
      guardianViewer([teamFixture({ id: "team-1", gender: "women" })]),
    );
    const { data } = await buildPlayerCardPayload("player-1");
    expect(data?.lastName).toBe("Hall");
    expect(data?.caption).toContain("7 Maya Hall");
  });

  it("drops an invalid club colour and tolerates a missing club", async () => {
    getClubMock.mockResolvedValue({
      data: clubFixture({ colour: "green" }),
      error: null,
    });
    expect((await buildPlayerCardPayload("player-1")).data?.clubColour).toBe(
      null,
    );

    getClubMock.mockResolvedValue({ data: null, error: null });
    const { data } = await buildPlayerCardPayload("player-1");
    expect(data).toMatchObject({
      clubName: "",
      clubColour: null,
      clubIconUrl: null,
    });
  });

  it("leaves the shirt number empty when none is assigned", async () => {
    getPlayerTeamsMock.mockResolvedValue({
      data: [membership("team-1", { shirt_number: null })],
      error: null,
    });
    const { data } = await buildPlayerCardPayload("player-1");
    expect(data?.shirtNumber).toBeNull();
  });

  it("allows club managers and coaches of the team", async () => {
    for (const viewer of [
      viewerFixture({
        managementClubIds: ["club-1"],
        coachTeamIds: [],
        visibleTeams: [teamFixture({ id: "team-1" })],
      }),
      viewerFixture({ visibleTeams: [teamFixture({ id: "team-1" })] }),
    ]) {
      getViewerContextMock.mockResolvedValue(viewer);
      const { data } = await buildPlayerCardPayload("player-1");
      expect(data?.teamId).toBe("team-1");
    }
  });

  it.each([
    [
      "the player themselves",
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["player"] },
        selfPlayerIds: ["player-1"],
      }),
    ],
    [
      "a guardian assistant",
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian_assistant"] },
      }),
    ],
    [
      "a guardian of another child",
      viewerFixture({
        coachTeamIds: [],
        editableTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian"] },
        guardianPlayerIds: ["player-9"],
      }),
    ],
    [
      "a coach of another team",
      viewerFixture({
        coachTeamIds: ["team-2"],
        editableTeamIds: ["team-2"],
      }),
    ],
    [
      "a manager of another club",
      viewerFixture({ managementClubIds: ["c-2"], coachTeamIds: [] }),
    ],
  ])("returns nothing for %s", async (_label, viewer) => {
    getViewerContextMock.mockResolvedValue(viewer);
    const result = await buildPlayerCardPayload("player-1");
    expect(result).toEqual({ data: null, error: null });
    expect(getAllTeamStatsMock).not.toHaveBeenCalled();
  });

  it("returns nothing when signed out", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await buildPlayerCardPayload("player-1")).toEqual({
      data: null,
      error: null,
    });
    expect(getPlayerMock).not.toHaveBeenCalled();
  });

  it("returns nothing for an unknown, inactive, or mismatched player", async () => {
    getPlayerMock.mockResolvedValue({ data: null, error: null });
    expect(await buildPlayerCardPayload("player-1")).toEqual({
      data: null,
      error: null,
    });

    getPlayerMock.mockResolvedValue({
      data: { ...player, active_role: false },
      error: null,
    });
    expect((await buildPlayerCardPayload("player-1")).data).toBeNull();

    getPlayerMock.mockResolvedValue({ data: player, error: null });
    expect(
      (await buildPlayerCardPayload("player-1", { personId: "someone-else" }))
        .data,
    ).toBeNull();
    expect(
      (await buildPlayerCardPayload("player-1", { personId: "person-1" })).data,
    ).not.toBeNull();
  });

  it("returns nothing when the player is on no visible team", async () => {
    getPlayerTeamsMock.mockResolvedValue({ data: [], error: null });
    expect((await buildPlayerCardPayload("player-1")).data).toBeNull();

    getPlayerTeamsMock.mockResolvedValue({
      data: [membership("team-hidden")],
      error: null,
    });
    expect((await buildPlayerCardPayload("player-1")).data).toBeNull();
  });

  it("returns nothing for a team in a different club than the player", async () => {
    getViewerContextMock.mockResolvedValue(
      guardianViewer([teamFixture({ id: "team-1", club_id: "club-2" })]),
    );
    expect((await buildPlayerCardPayload("player-1")).data).toBeNull();
  });

  describe("with several teams", () => {
    const teams = [
      teamFixture({ id: "team-1", name: "U11 Blues" }),
      teamFixture({ id: "team-2", name: "U12 Reds" }),
    ];

    beforeEach(() => {
      getViewerContextMock.mockResolvedValue(guardianViewer(teams));
      getPlayerTeamsMock.mockResolvedValue({
        data: [
          membership("team-1", { active: false }),
          membership("team-2", { shirt_number: 11 }),
        ],
        error: null,
      });
    });

    it("prefers the team the player is currently active on", async () => {
      const { data } = await buildPlayerCardPayload("player-1");
      expect(data).toMatchObject({ teamId: "team-2", shirtNumber: 11 });
    });

    it("uses the viewer's active team when the player is on it", async () => {
      getActiveTeamMock.mockResolvedValue(teams[0]);
      expect((await buildPlayerCardPayload("player-1")).data?.teamId).toBe(
        "team-1",
      );
    });

    it("uses an explicitly requested team", async () => {
      const { data } = await buildPlayerCardPayload("player-1", {
        teamId: "team-1",
      });
      expect(data?.teamId).toBe("team-1");
    });

    it("rejects a requested team the player is not on", async () => {
      const result = await buildPlayerCardPayload("player-1", {
        teamId: "team-9",
      });
      expect(result).toEqual({ data: null, error: null });
    });

    it("only offers teams the viewer coaches", async () => {
      getViewerContextMock.mockResolvedValue(
        viewerFixture({
          coachTeamIds: ["team-1"],
          editableTeamIds: ["team-1"],
          visibleTeams: teams,
        }),
      );
      expect((await buildPlayerCardPayload("player-1")).data?.teamId).toBe(
        "team-1",
      );
      expect(
        (await buildPlayerCardPayload("player-1", { teamId: "team-2" })).data,
      ).toBeNull();
    });
  });

  it("surfaces load failures", async () => {
    getPlayerMock.mockResolvedValue({ data: null, error: "player failed" });
    expect(await buildPlayerCardPayload("player-1")).toEqual({
      data: null,
      error: "player failed",
    });

    getPlayerMock.mockResolvedValue({ data: player, error: null });
    getPlayerTeamsMock.mockResolvedValue({ data: [], error: "teams failed" });
    expect((await buildPlayerCardPayload("player-1")).error).toBe(
      "teams failed",
    );

    getPlayerTeamsMock.mockResolvedValue({
      data: [membership("team-1")],
      error: null,
    });
    getAllTeamStatsMock.mockResolvedValue({ ...stats, error: "stats failed" });
    expect(await buildPlayerCardPayload("player-1")).toEqual({
      data: null,
      error: "stats failed",
    });
  });
});
