import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { venueFixture, viewerFixture } from "@/test/fixtures";

const { createClientMock, getViewerContextMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getViewerContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createClientMock(),
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return { ...actual, getViewerContext: getViewerContextMock };
});
// Provide a passthrough unstable_cache so data-layer tests run without the
// Next.js incremental-cache infrastructure.
vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends unknown[], R>(fn: (...args: T) => Promise<R>) =>
    (...args: T) =>
      fn(...args),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

import {
  createVenue,
  deleteVenue,
  getVenue,
  listVenues,
  updateVenue,
} from "@/lib/data/venues";

describe("venues data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewerContextMock.mockResolvedValue(viewerFixture());
  });

  it("lists venues and filters by club", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ venues: okResult([venueFixture()]) }),
    );
    const all = await listVenues();
    expect(all.data).toHaveLength(1);

    const filtered = await listVenues("club-1");
    expect(filtered.error).toBeNull();
  });

  it("does not read the cached club venues for a viewer without access", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ venues: okResult([venueFixture()]) }),
    );

    expect(await listVenues("club-other")).toEqual({
      data: [],
      error: "Club not found.",
    });

    getViewerContextMock.mockResolvedValue(null);
    expect(await listVenues("club-1")).toEqual({
      data: [],
      error: "Club not found.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("gets, creates, updates, and deletes venues", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ venues: okResult(venueFixture()) }),
    );
    expect((await getVenue("venue-1")).data?.name).toBe("Main Pitch");
    expect(
      (await createVenue({ club_id: "club-1", name: "Pitch" })).data?.id,
    ).toBe("venue-1");
    expect(
      (await updateVenue("venue-1", { name: "Updated" })).error,
    ).toBeNull();

    createClientMock.mockReturnValue(
      mockFromClient({ venues: okResult(null) }),
    );
    expect(await deleteVenue("venue-1")).toEqual({ error: null });
  });

  it("maps query errors", async () => {
    createClientMock.mockReturnValue(
      mockFromClient({ venues: errResult("nope") }),
    );
    expect(await getVenue("x")).toEqual({ data: null, error: "nope" });
  });
});
