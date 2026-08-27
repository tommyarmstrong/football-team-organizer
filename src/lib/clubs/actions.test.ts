import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import { clubManagerViewer, viewerFixture } from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  createClubMock,
  getClubMock,
  updateClubMock,
  createClientMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  createClubMock: vi.fn(),
  getClubMock: vi.fn(),
  updateClubMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/clubs", () => ({
  createClub: createClubMock,
  getClub: getClubMock,
  updateClub: updateClubMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { createClubAction, updateClubAction } from "@/lib/clubs/actions";

describe("club actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    createClubMock.mockResolvedValue({ error: null });
    getClubMock.mockResolvedValue({
      data: {
        id: "club-1",
        name: "Example FC",
        colour: "#112233",
        icon_url: "https://example.com/icon.png",
      },
      error: null,
    });
    updateClubMock.mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({
            data: { publicUrl: "https://cdn.example/icon.png" },
          }),
        }),
      },
    });
  });

  it("requires a club name on create", async () => {
    expect(await createClubAction({}, formDataFrom({}))).toMatchObject({
      error: expect.stringMatching(/club name/i),
    });
  });

  it("creates a club and redirects", async () => {
    await expect(
      createClubAction({}, formDataFrom({ name: "New Club" })),
    ).rejects.toThrow("redirect:/team");
  });

  it("gates updates behind auth and management", async () => {
    getViewerContextMock.mockResolvedValue(null);
    expect(
      await updateClubAction(
        {},
        formDataFrom({ id: "club-1", name: "Example FC" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/not signed in/i) });

    getViewerContextMock.mockResolvedValue(
      viewerFixture({ managementClubIds: [], isManagement: false }),
    );
    expect(
      await updateClubAction(
        {},
        formDataFrom({ id: "club-1", name: "Example FC" }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/only club management/i) });
  });

  it("validates established year and updates", async () => {
    expect(
      await updateClubAction(
        {},
        formDataFrom({
          id: "club-1",
          name: "Example FC",
          established: "1700",
        }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/1800 and 2100/i) });

    await expect(
      updateClubAction(
        {},
        formDataFrom({
          id: "club-1",
          name: "Example FC",
          website: "https://example.com",
          clear_colour: "true",
          clear_icon: "true",
        }),
      ),
    ).rejects.toThrow("redirect:/club");

    expect(updateClubMock).toHaveBeenCalledWith(
      "club-1",
      expect.objectContaining({
        colour: null,
        icon_url: null,
      }),
    );
  });

  it("uploads a valid icon file", async () => {
    const file = new File(["png-bytes"], "logo.png", { type: "image/png" });
    await expect(
      updateClubAction(
        {},
        formDataFrom({
          id: "club-1",
          name: "Example FC",
          icon: file,
        }),
      ),
    ).rejects.toThrow("redirect:/club");
    expect(updateClubMock).toHaveBeenCalledWith(
      "club-1",
      expect.objectContaining({
        icon_url: "https://cdn.example/icon.png",
      }),
    );
  });

  it("rejects invalid icon mime types", async () => {
    const file = new File(["x"], "logo.txt", { type: "text/plain" });
    expect(
      await updateClubAction(
        {},
        formDataFrom({
          id: "club-1",
          name: "Example FC",
          icon: file,
        }),
      ),
    ).toMatchObject({ error: expect.stringMatching(/png, jpeg, webp/i) });
  });
});
