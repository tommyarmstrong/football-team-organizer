import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFromClient, okResult, errResult } from "@/test/supabase-mock";
import { venueFixture } from "@/test/fixtures";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
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
  });

  it("lists venues and filters by club", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ venues: okResult([venueFixture()]) }),
    );
    const all = await listVenues();
    expect(all.data).toHaveLength(1);

    const filtered = await listVenues("club-1");
    expect(filtered.error).toBeNull();
  });

  it("gets, creates, updates, and deletes venues", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ venues: okResult(venueFixture()) }),
    );
    expect((await getVenue("venue-1")).data?.name).toBe("Main Pitch");
    expect(
      (await createVenue({ club_id: "club-1", name: "Pitch" })).data?.id,
    ).toBe("venue-1");
    expect(
      (await updateVenue("venue-1", { name: "Updated" })).error,
    ).toBeNull();

    createClientMock.mockResolvedValue(
      mockFromClient({ venues: okResult(null) }),
    );
    expect(await deleteVenue("venue-1")).toEqual({ error: null });
  });

  it("maps query errors", async () => {
    createClientMock.mockResolvedValue(
      mockFromClient({ venues: errResult("nope") }),
    );
    expect(await getVenue("x")).toEqual({ data: null, error: "nope" });
  });
});
