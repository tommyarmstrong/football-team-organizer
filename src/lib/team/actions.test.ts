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
  createClientMock,
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
  createClientMock: vi.fn(),
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
vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
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
  createCompetitionAndReturnAction,
  createTeamAction,
  deleteCompetitionAction,
  saveCompetitionAndReturnAction,
  setActiveTeamAction,
  startNewSeasonAction,
  unarchiveTeamAction,
  updateCompetitionAction,
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

function mockStorageClient(options?: {
  uploadError?: string | null;
  publicUrl?: string;
}) {
  const uploadError = options?.uploadError ?? null;
  const publicUrl =
    options?.publicUrl ?? "https://cdn.example/team-photos/photo.png";
  return {
    storage: {
      from() {
        return {
          upload: async () =>
            uploadError ? { error: { message: uploadError } } : { error: null },
          getPublicUrl: () => ({ data: { publicUrl } }),
        };
      },
    },
  };
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

  it("rejects missing required fields and invalid enums", async () => {
    expect(
      await updateTeamAction({}, formDataFrom({ season_label: "2025/26" })),
    ).toMatchObject({ error: expect.stringMatching(/required/i) });

    expect(
      await updateTeamAction({}, validTeamForm({ age_group: "U99" })),
    ).toMatchObject({ error: expect.stringMatching(/age group/i) });

    expect(
      await updateTeamAction({}, validTeamForm({ gender: "alien" })),
    ).toMatchObject({ error: expect.stringMatching(/gender/i) });
  });

  it("clears photos and returns update / head-coach errors", async () => {
    const cleared = validTeamForm({ clear_photo: "true" });
    updateTeamMock.mockResolvedValueOnce({ error: "write failed" });
    expect(await updateTeamAction({}, cleared)).toEqual({
      error: "write failed",
    });
    expect(updateTeamMock).toHaveBeenCalledWith(
      "team-1",
      expect.objectContaining({ photo_url: null }),
    );

    updateTeamMock.mockResolvedValue({ error: null });
    setTeamHeadCoachMock.mockResolvedValue({ error: "head coach failed" });
    expect(await updateTeamAction({}, validTeamForm())).toEqual({
      error: "head coach failed",
    });
  });

  it("rejects invalid photo mime types and oversized files", async () => {
    const badType = validTeamForm();
    badType.set("photo", new File(["x"], "notes.txt", { type: "text/plain" }));
    expect(await updateTeamAction({}, badType)).toMatchObject({
      error: expect.stringMatching(/png|jpeg|webp|gif/i),
    });

    const tooBig = validTeamForm();
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
    tooBig.set("photo", new File([bytes], "big.png", { type: "image/png" }));
    expect(await updateTeamAction({}, tooBig)).toMatchObject({
      error: expect.stringMatching(/5 mb/i),
    });
  });

  it("uploads a team photo then updates", async () => {
    createClientMock.mockResolvedValue(mockStorageClient());

    const form = validTeamForm();
    form.set("photo", new File(["png"], "crest.png", { type: "image/png" }));
    await expect(updateTeamAction({}, form)).rejects.toThrow("redirect:/team");
    expect(updateTeamMock).toHaveBeenCalledWith(
      "team-1",
      expect.objectContaining({
        photo_url: "https://cdn.example/team-photos/photo.png",
      }),
    );
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

  it("requires sign-in", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(await createTeamAction({}, validTeamForm())).toEqual({
      error: "Not signed in.",
    });
  });

  it("returns create and head-coach errors", async () => {
    createTeamMock.mockResolvedValue({ data: null, error: "create failed" });
    expect(await createTeamAction({}, validTeamForm())).toEqual({
      error: "create failed",
    });

    createTeamMock.mockResolvedValue({ data: null, error: null });
    expect(await createTeamAction({}, validTeamForm())).toEqual({
      error: "Could not create team.",
    });

    createTeamMock.mockResolvedValue({
      data: teamFixture({ id: "team-new" }),
      error: null,
    });
    setTeamHeadCoachMock.mockResolvedValue({ error: "head failed" });
    expect(
      await createTeamAction({}, validTeamForm({ head_coach_id: "coach-1" })),
    ).toEqual({ error: "head failed" });
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

  it("requires edit permission", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({ editableTeamIds: [] }),
    );
    expect(await archiveTeamAction({}, formDataFrom({}))).toMatchObject({
      error: expect.stringMatching(/permission/i),
    });
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

  it("returns archive write errors", async () => {
    isTeamArchivedMock.mockReturnValue(false);
    archiveTeamMock.mockResolvedValue({ error: "archive boom" });
    expect(await archiveTeamAction({}, formDataFrom({}))).toEqual({
      error: "archive boom",
    });
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

  it("rejects invalid age groups and season write failures", async () => {
    expect(
      await startNewSeasonAction(
        {},
        formDataFrom({ season_label: "2026/27", age_group: "U99" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/age group/i) });

    startNewTeamSeasonMock.mockResolvedValue({
      data: null,
      error: "season failed",
    });
    expect(
      await startNewSeasonAction({}, formDataFrom({ season_label: "2026/27" })),
    ).toEqual({ error: "season failed" });

    startNewTeamSeasonMock.mockResolvedValue({ data: null, error: null });
    expect(
      await startNewSeasonAction({}, formDataFrom({ season_label: "2026/27" })),
    ).toEqual({ error: "Could not start the new season." });
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

describe("competition actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCompetitionMock.mockResolvedValue({
      data: { id: "comp-1", name: "County League" },
      error: null,
    });
    updateCompetitionMock.mockResolvedValue({ error: null });
    deleteCompetitionMock.mockResolvedValue({ error: null });
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

  it("validates competition season, age group, gender, and ints", async () => {
    expect(
      await createCompetitionAction(
        {},
        formDataFrom({ name: "League", season: "bad" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/season/i) });

    expect(
      await createCompetitionAction(
        {},
        formDataFrom({ name: "League", age_group: "U99" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/age group/i) });

    expect(
      await createCompetitionAction(
        {},
        formDataFrom({ name: "League", gender: "alien" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/gender/i) });

    expect(
      await createCompetitionAction(
        {},
        formDataFrom({ name: "League", players_per_team: "nope" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/players per team/i) });
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
        venue: "unknown",
      }),
    );
    expect(result.success).toMatch(/added/i);
  });

  it("updates competitions and supports venue mode", async () => {
    const result = await updateCompetitionAction(
      "comp-1",
      {},
      formDataFrom({
        name: "Cup",
        kind: "cup",
        season: "2025/26",
        age_group: "U12",
        gender: "male",
        periods: "2",
        result: "ongoing",
        venue: "venue-1",
        knockout: "yes",
      }),
    );
    expect(result.success).toMatch(/updated/i);
    expect(updateCompetitionMock).toHaveBeenCalledWith(
      "comp-1",
      expect.objectContaining({
        venue_mode: "venue",
        venue_id: "venue-1",
        knockout: true,
      }),
    );
  });

  it("saves and creates competitions with redirect helpers", async () => {
    await expect(
      saveCompetitionAndReturnAction(
        "comp-1",
        {},
        formDataFrom({ name: "League", season: "2025/26" }),
      ),
    ).rejects.toThrow("redirect:/competitions/comp-1");

    await expect(
      createCompetitionAndReturnAction(
        {},
        formDataFrom({ name: "League", season: "2025/26" }),
      ),
    ).rejects.toThrow("redirect:/competitions/comp-1");
  });

  it("deletes competitions and redirects to dashboard", async () => {
    await expect(deleteCompetitionAction("comp-1")).rejects.toThrow(
      "redirect:/dashboard",
    );
    deleteCompetitionMock.mockResolvedValue({ error: "delete failed" });
    expect(await deleteCompetitionAction("comp-1")).toEqual({
      error: "delete failed",
    });
  });
});
