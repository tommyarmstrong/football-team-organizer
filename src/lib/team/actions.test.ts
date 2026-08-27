import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { clubManagerViewer, teamFixture, viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  cookiesSetMock,
  getViewerContextMock,
  getActiveTeamMock,
  getPrimaryClubMock,
  createTeamMock,
  updateTeamMock,
  archiveTeamMock,
  unarchiveTeamMock,
  startNewTeamSeasonMock,
  setTeamHeadCoachMock,
  createCompetitionMock,
  updateCompetitionMock,
  deleteCompetitionMock,
  isTeamArchivedMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  cookiesSetMock: vi.fn(),
  getViewerContextMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  createTeamMock: vi.fn(),
  updateTeamMock: vi.fn(),
  archiveTeamMock: vi.fn(),
  unarchiveTeamMock: vi.fn(),
  startNewTeamSeasonMock: vi.fn(),
  setTeamHeadCoachMock: vi.fn(),
  createCompetitionMock: vi.fn(),
  updateCompetitionMock: vi.fn(),
  deleteCompetitionMock: vi.fn(),
  isTeamArchivedMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSetMock, get: vi.fn(), delete: vi.fn() }),
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/team", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/team")>();
  return {
    ...actual,
    getActiveTeam: getActiveTeamMock,
    createTeam: createTeamMock,
    updateTeam: updateTeamMock,
    archiveTeam: archiveTeamMock,
    unarchiveTeam: unarchiveTeamMock,
    startNewTeamSeason: startNewTeamSeasonMock,
    isTeamArchived: isTeamArchivedMock,
  };
});
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/coaches", () => ({
  setTeamHeadCoach: setTeamHeadCoachMock,
}));
vi.mock("@/lib/data/competitions", () => ({
  createCompetition: createCompetitionMock,
  updateCompetition: updateCompetitionMock,
  deleteCompetition: deleteCompetitionMock,
}));

import {
  archiveTeamAction,
  createCompetitionAction,
  createTeamAction,
  setActiveTeamAction,
  startNewSeasonAction,
  unarchiveTeamAction,
  updateTeamAction,
} from "@/lib/team/actions";

function validTeamForm(overrides: Record<string, string> = {}): FormData {
  return formDataFrom({
    name: "U12 Blues",
    age_group: "U12",
    gender: "mixed",
    season_label: "2025/26",
    ...overrides,
  });
}

describe("setActiveTeamAction", () => {
  it("sets the active team cookie and revalidates layout", async () => {
    await setActiveTeamAction("team-9");
    expect(cookiesSetMock).toHaveBeenCalledWith(
      "fto_active_team",
      "team-9",
      expect.objectContaining({ path: "/" }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });
});

describe("updateTeamAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveTeamMock.mockResolvedValue(teamFixture());
    updateTeamMock.mockResolvedValue({ error: null });
    setTeamHeadCoachMock.mockResolvedValue({ error: null });
  });

  it("requires an active team", async () => {
    getActiveTeamMock.mockResolvedValue(null);
    expect(await updateTeamAction({}, validTeamForm())).toMatchObject({
      error: expect.stringMatching(/no team selected/i),
    });
  });

  it("rejects invalid season labels", async () => {
    const result = await updateTeamAction(
      {},
      validTeamForm({ season_label: "2025" }),
    );
    expect(result.error).toMatch(/season/i);
  });

  it("updates and redirects", async () => {
    await expect(updateTeamAction({}, validTeamForm())).rejects.toThrow(
      "redirect:/team",
    );
    expect(updateTeamMock).toHaveBeenCalled();
  });
});

describe("createTeamAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue({ id: "club-1", name: "Club" });
    getActiveTeamMock.mockResolvedValue(null);
    createTeamMock.mockResolvedValue({
      data: teamFixture({ id: "team-new" }),
      error: null,
    });
    setTeamHeadCoachMock.mockResolvedValue({ error: null });
  });

  it("requires club management access", async () => {
    getViewerContextMock.mockResolvedValue(viewerFixture());
    const result = await createTeamAction({}, validTeamForm());
    expect(result.error).toMatch(/no club found/i);
  });

  it("creates a team, sets cookie, and redirects", async () => {
    await expect(createTeamAction({}, validTeamForm())).rejects.toThrow(
      "redirect:/team",
    );
    expect(cookiesSetMock).toHaveBeenCalledWith(
      "fto_active_team",
      "team-new",
      expect.any(Object),
    );
  });
});

describe("archiveTeamAction / unarchiveTeamAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getActiveTeamMock.mockResolvedValue(teamFixture());
    archiveTeamMock.mockResolvedValue({ error: null });
    unarchiveTeamMock.mockResolvedValue({ error: null });
  });

  it("archives an active season", async () => {
    isTeamArchivedMock.mockReturnValue(false);
    const result = await archiveTeamAction({}, formDataFrom({}));
    expect(result.success).toMatch(/archived/i);
    expect(archiveTeamMock).toHaveBeenCalledWith("team-1");
  });

  it("rejects double-archive", async () => {
    isTeamArchivedMock.mockReturnValue(true);
    const result = await archiveTeamAction({}, formDataFrom({}));
    expect(result.error).toMatch(/already archived/i);
  });

  it("restores an archived season", async () => {
    isTeamArchivedMock.mockReturnValue(true);
    const result = await unarchiveTeamAction({}, formDataFrom({}));
    expect(result.success).toMatch(/restored/i);
  });

  it("rejects unarchive when not archived", async () => {
    isTeamArchivedMock.mockReturnValue(false);
    const result = await unarchiveTeamAction({}, formDataFrom({}));
    expect(result.error).toMatch(/not archived/i);
  });
});

describe("startNewSeasonAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
    getActiveTeamMock.mockResolvedValue(teamFixture());
    startNewTeamSeasonMock.mockResolvedValue({
      data: teamFixture({ id: "team-next", season_label: "2026/27" }),
      error: null,
    });
  });

  it("requires a valid new season label", async () => {
    expect(
      await startNewSeasonAction({}, formDataFrom({ season_label: "" })),
    ).toMatchObject({ error: expect.stringMatching(/new season/i) });

    expect(
      await startNewSeasonAction({}, formDataFrom({ season_label: "bad" })),
    ).toMatchObject({ error: expect.stringMatching(/season/i) });
  });

  it("starts a season and redirects", async () => {
    await expect(
      startNewSeasonAction(
        {},
        formDataFrom({
          season_label: "2026/27",
          migrate_players: "on",
          migrate_coaches: "on",
        }),
      ),
    ).rejects.toThrow("redirect:/team");
    expect(startNewTeamSeasonMock).toHaveBeenCalled();
  });
});

describe("createCompetitionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCompetitionMock.mockResolvedValue({ error: null });
  });

  it("requires a competition name", async () => {
    const result = await createCompetitionAction(
      {},
      formDataFrom({
        kind: "league",
        gender: "mixed",
        season: "2025/26",
        periods: "halves",
      }),
    );
    expect(result.error).toMatch(/name/i);
  });

  it("creates a competition", async () => {
    const result = await createCompetitionAction(
      {},
      formDataFrom({
        name: "County League",
        kind: "league",
        gender: "mixed",
        season: "2025/26",
        periods: "halves",
        result: "ongoing",
      }),
    );
    expect(result.success).toMatch(/added/i);
  });
});
