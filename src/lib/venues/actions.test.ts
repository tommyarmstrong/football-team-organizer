import { beforeEach, describe, expect, it, vi } from "vitest";
import { formDataFrom } from "@/test/form-data";
import {
  clubManagerViewer,
  venueFixture,
  viewerFixture,
} from "@/test/fixtures";

const {
  revalidatePathMock,
  redirectMock,
  getViewerContextMock,
  getPrimaryClubMock,
  createVenueMock,
  updateVenueMock,
  deleteVenueMock,
  getVenueMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getViewerContextMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  createVenueMock: vi.fn(),
  updateVenueMock: vi.fn(),
  deleteVenueMock: vi.fn(),
  getVenueMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/venues", () => ({
  createVenue: createVenueMock,
  updateVenue: updateVenueMock,
  deleteVenue: deleteVenueMock,
  getVenue: getVenueMock,
}));

import {
  createVenueAction,
  deleteVenueAction,
  updateVenueAction,
} from "@/lib/venues/actions";

describe("venue actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(clubManagerViewer());
    getPrimaryClubMock.mockResolvedValue({ id: "club-1", name: "Club" });
    createVenueMock.mockResolvedValue({
      data: venueFixture(),
      error: null,
    });
    updateVenueMock.mockResolvedValue({ error: null });
    deleteVenueMock.mockResolvedValue({ error: null });
  });

  it("requires sign-in to create", async () => {
    getViewerContextMock.mockResolvedValue(null);
    const result = await createVenueAction(
      {},
      formDataFrom({ name: "Pitch 1" }),
    );
    expect(result.error).toMatch(/not signed in/i);
  });

  it("requires coach or management to create", async () => {
    getViewerContextMock.mockResolvedValue(
      viewerFixture({
        managementClubIds: [],
        coachTeamIds: [],
        editableTeamIds: [],
      }),
    );
    const result = await createVenueAction(
      {},
      formDataFrom({ name: "Pitch 1" }),
    );
    expect(result.error).toMatch(/only coaches and club management/i);
  });

  it("creates a venue and redirects", async () => {
    await expect(
      createVenueAction({}, formDataFrom({ name: "Pitch 1" })),
    ).rejects.toThrow("redirect:/venues/venue-1");
  });

  it("updates an existing venue", async () => {
    getVenueMock.mockResolvedValue({
      data: venueFixture(),
      error: null,
    });
    await expect(
      updateVenueAction("venue-1", {}, formDataFrom({ name: "Pitch 2" })),
    ).rejects.toThrow("redirect:/venues/venue-1");
  });

  it("deletes a venue", async () => {
    getVenueMock.mockResolvedValue({
      data: venueFixture(),
      error: null,
    });
    await expect(deleteVenueAction("venue-1")).rejects.toThrow(
      "redirect:/venues",
    );
  });
});
