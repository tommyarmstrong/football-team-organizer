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
  createClientMock,
  removeMock,
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
  createClientMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/venues", () => ({
  createVenue: createVenueMock,
  updateVenue: updateVenueMock,
  deleteVenue: deleteVenueMock,
  getVenue: getVenueMock,
}));

import {
  createVenueAction,
  createVenueOnPageAction,
  deleteVenueAction,
  updateVenueAction,
  updateVenueOnPageAction,
} from "@/lib/venues/actions";

const PHOTO_URL =
  "https://x.supabase.co/storage/v1/object/public/venue-photos/club-1/old.jpg";
const NEW_PHOTO_URL =
  "https://x.supabase.co/storage/v1/object/public/venue-photos/club-1/new.png";

function mockStorageClient(uploadError: string | null = null) {
  const upload = vi.fn(async () =>
    uploadError ? { error: { message: uploadError } } : { error: null },
  );
  createClientMock.mockResolvedValue({
    storage: {
      from: () => ({
        upload,
        remove: removeMock,
        getPublicUrl: () => ({ data: { publicUrl: NEW_PHOTO_URL } }),
      }),
    },
  });
  return upload;
}

function pngFile(size = 3): File {
  return new File([new Uint8Array(size)], "pitch.png", { type: "image/png" });
}

describe("venue actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeMock.mockResolvedValue({ error: null });
    mockStorageClient();
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

  it("creates a venue on the page without redirecting", async () => {
    const result = await createVenueOnPageAction(
      {},
      formDataFrom({ name: "Pitch 1" }),
    );
    expect(result).toEqual({ success: "Venue added." });
    expect(redirectMock).not.toHaveBeenCalled();
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

  it("saves a venue on the page without redirecting", async () => {
    getVenueMock.mockResolvedValue({
      data: venueFixture(),
      error: null,
    });
    const result = await updateVenueOnPageAction(
      "venue-1",
      {},
      formDataFrom({ name: "Pitch 2" }),
    );
    expect(result).toEqual({ success: "Venue saved." });
    expect(redirectMock).not.toHaveBeenCalled();
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

  describe("venue photo", () => {
    it("uploads a photo under the club folder when creating", async () => {
      const upload = mockStorageClient();
      const form = formDataFrom({ name: "Pitch 1", photo: pngFile() });
      await createVenueOnPageAction({}, form);
      expect(upload).toHaveBeenCalledWith(
        expect.stringMatching(/^club-1\/.+\.png$/),
        expect.any(Uint8Array),
        expect.objectContaining({ contentType: "image/png" }),
      );
      expect(createVenueMock).toHaveBeenCalledWith(
        expect.objectContaining({ photo_url: NEW_PHOTO_URL }),
      );
    });

    it("creates without a photo when none is chosen", async () => {
      await createVenueOnPageAction({}, formDataFrom({ name: "Pitch 1" }));
      expect(createVenueMock).toHaveBeenCalledWith(
        expect.objectContaining({ photo_url: null }),
      );
    });

    it("rejects unsupported types and oversized photos", async () => {
      const badType = formDataFrom({
        name: "Pitch 1",
        photo: new File(["x"], "notes.txt", { type: "text/plain" }),
      });
      expect(await createVenueOnPageAction({}, badType)).toMatchObject({
        error: expect.stringMatching(/png|jpeg|webp|gif/i),
      });

      const tooBig = formDataFrom({
        name: "Pitch 1",
        photo: pngFile(5 * 1024 * 1024 + 1),
      });
      expect(await createVenueOnPageAction({}, tooBig)).toMatchObject({
        error: expect.stringMatching(/5 mb/i),
      });
      expect(createVenueMock).not.toHaveBeenCalled();
    });

    it("surfaces upload failures without saving the venue", async () => {
      mockStorageClient("bucket missing");
      const result = await createVenueOnPageAction(
        {},
        formDataFrom({ name: "Pitch 1", photo: pngFile() }),
      );
      expect(result).toEqual({ error: "bucket missing" });
      expect(createVenueMock).not.toHaveBeenCalled();
    });

    it("keeps the existing photo when editing without a new file", async () => {
      getVenueMock.mockResolvedValue({
        data: venueFixture({ photo_url: PHOTO_URL }),
        error: null,
      });
      await updateVenueOnPageAction(
        "venue-1",
        {},
        formDataFrom({ name: "Pitch 2" }),
      );
      expect(updateVenueMock).toHaveBeenCalledWith(
        "venue-1",
        expect.objectContaining({ photo_url: PHOTO_URL }),
      );
      expect(removeMock).not.toHaveBeenCalled();
    });

    it("replaces a photo and removes the old file", async () => {
      getVenueMock.mockResolvedValue({
        data: venueFixture({ photo_url: PHOTO_URL }),
        error: null,
      });
      await updateVenueOnPageAction(
        "venue-1",
        {},
        formDataFrom({ name: "Pitch 2", photo: pngFile() }),
      );
      expect(updateVenueMock).toHaveBeenCalledWith(
        "venue-1",
        expect.objectContaining({ photo_url: NEW_PHOTO_URL }),
      );
      expect(removeMock).toHaveBeenCalledWith(["club-1/old.jpg"]);
    });

    it("clears the photo on request", async () => {
      getVenueMock.mockResolvedValue({
        data: venueFixture({ photo_url: PHOTO_URL }),
        error: null,
      });
      await updateVenueOnPageAction(
        "venue-1",
        {},
        formDataFrom({ name: "Pitch 2", clear_photo: "true" }),
      );
      expect(updateVenueMock).toHaveBeenCalledWith(
        "venue-1",
        expect.objectContaining({ photo_url: null }),
      );
      expect(removeMock).toHaveBeenCalledWith(["club-1/old.jpg"]);
    });

    it("removes the stored photo when the venue is deleted", async () => {
      getVenueMock.mockResolvedValue({
        data: venueFixture({ photo_url: PHOTO_URL }),
        error: null,
      });
      await expect(deleteVenueAction("venue-1")).rejects.toThrow(
        "redirect:/venues",
      );
      expect(removeMock).toHaveBeenCalledWith(["club-1/old.jpg"]);
    });
  });
});
