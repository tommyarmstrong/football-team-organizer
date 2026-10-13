import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  setCompetitionSquadMock,
  getViewerContextMock,
  getCompetitionMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  setCompetitionSquadMock: vi.fn(),
  getViewerContextMock: vi.fn(),
  getCompetitionMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/competitions", () => ({
  getCompetition: getCompetitionMock,
}));
vi.mock("@/lib/data/competition-players", () => ({
  setCompetitionSquad: setCompetitionSquadMock,
}));

import { saveTournamentSquadAction } from "@/lib/competition-players/actions";

const tournament = {
  id: "comp-1",
  team_id: "team-1",
  kind: "tournament",
};

describe("saveTournamentSquadAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCompetitionSquadMock.mockResolvedValue({ error: null });
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getCompetitionMock.mockResolvedValue({ data: tournament, error: null });
  });

  it("saves selected player ids", async () => {
    const result = await saveTournamentSquadAction(
      "comp-1",
      {},
      formDataFrom({ player_id: ["p1", "p2", ""] }),
    );
    expect(result.success).toMatch(/saved/i);
    expect(setCompetitionSquadMock).toHaveBeenCalledWith("comp-1", [
      "p1",
      "p2",
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/competitions/comp-1");
  });

  it("allows guardian assistants to save the squad", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        editableTeamIds: [],
        coachTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian_assistant"] },
      }),
    );

    const result = await saveTournamentSquadAction(
      "comp-1",
      {},
      formDataFrom({ player_id: ["p1"] }),
    );
    expect(result.success).toMatch(/saved/i);
    expect(setCompetitionSquadMock).toHaveBeenCalledWith("comp-1", ["p1"]);
  });

  it("rejects viewers without match-day edit access", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        editableTeamIds: [],
        coachTeamIds: [],
        memberTeamRoles: { "team-1": ["guardian"] },
      }),
    );

    const result = await saveTournamentSquadAction(
      "comp-1",
      {},
      formDataFrom({ player_id: ["p1"] }),
    );
    expect(result.error).toMatch(/permission/i);
    expect(setCompetitionSquadMock).not.toHaveBeenCalled();
  });

  it("rejects squads on competitions that are not tournaments", async () => {
    getCompetitionMock.mockResolvedValue({
      data: { ...tournament, kind: "league" },
      error: null,
    });

    const result = await saveTournamentSquadAction(
      "comp-1",
      {},
      formDataFrom({ player_id: ["p1"] }),
    );
    expect(result.error).toMatch(/tournament/i);
    expect(setCompetitionSquadMock).not.toHaveBeenCalled();
  });

  it("returns squad errors", async () => {
    setCompetitionSquadMock.mockResolvedValue({ error: "boom" });
    const result = await saveTournamentSquadAction(
      "comp-1",
      {},
      formDataFrom({}),
    );
    expect(result.error).toBe("boom");
  });
});
