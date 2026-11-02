import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildMatchPostcardPayloadMock } = vi.hoisted(() => ({
  buildMatchPostcardPayloadMock: vi.fn(),
}));

vi.mock("@/lib/postcards/match-postcard", () => ({
  buildMatchPostcardPayload: buildMatchPostcardPayloadMock,
}));

import { GET } from "@/app/(app)/matches/[id]/postcard/meta/route";

describe("GET /matches/[id]/postcard/meta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the caption and file name for a scheduled fixture", async () => {
    buildMatchPostcardPayloadMock.mockResolvedValue({
      data: {
        kind: "scheduled",
        caption: "U11 Girls vs Riverside",
        fileName: "u11-girls-vs-riverside.png",
      },
      error: null,
    });

    const response = await GET(new Request("http://localhost/meta"), {
      params: Promise.resolve({ id: "match-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      caption: "U11 Girls vs Riverside",
      fileName: "u11-girls-vs-riverside.png",
      kind: "scheduled",
    });
    expect(buildMatchPostcardPayloadMock).toHaveBeenCalledWith("match-1");
  });

  it("returns 404 when a postcard cannot be built", async () => {
    buildMatchPostcardPayloadMock.mockResolvedValue({
      data: null,
      error: "Postcard is only available for scheduled and played matches.",
    });

    const response = await GET(new Request("http://localhost/meta"), {
      params: Promise.resolve({ id: "match-1" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Postcard is only available for scheduled and played matches.",
    });
  });
});
