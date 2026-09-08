import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildMatchPostcardPayloadMock } = vi.hoisted(() => ({
  buildMatchPostcardPayloadMock: vi.fn(),
}));

vi.mock("@/lib/postcards/match-postcard", () => ({
  buildMatchPostcardPayload: buildMatchPostcardPayloadMock,
}));

vi.mock("@/lib/postcards/postcard-image", () => ({
  MatchPostcardImage: () => null,
  POSTCARD_WIDTH: 1080,
  POSTCARD_HEIGHT: 1350,
}));

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor(
      _element: unknown,
      options: { headers?: Record<string, string> } = {},
    ) {
      super("png-bytes", {
        status: 200,
        headers: { "Content-Type": "image/png", ...options.headers },
      });
    }
  },
}));

import { GET } from "@/app/(app)/matches/[id]/postcard/route";

const playedPayload = {
  matchId: "match-1",
  clubName: "MGA",
  clubColour: "#146C4A",
  clubIconUrl: null,
  teamName: "U11 Girls",
  seasonLabel: "2025/26",
  opponentName: "Riverside",
  dateLabel: "Sun 8 Mar 2026",
  homeAwayLabel: "Home",
  competitionLabel: "League",
  homeName: "U11 Girls",
  awayName: "Riverside",
  homeScore: 1,
  awayScore: 0,
  scoreLabel: "1–0",
  result: "W" as const,
  story: "Kept a clean sheet.",
  goalList: { kind: "none" as const },
  coachPotmLabel: null,
  playersPotmLabel: null,
  form: ["W"] as Array<"W" | "D" | "L">,
  caption: "U11 Girls 1–0 Riverside",
  fileName: "u11-girls-2026-03-08-vs-riverside.png",
};

describe("GET /matches/[id]/postcard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the match is missing", async () => {
    buildMatchPostcardPayloadMock.mockResolvedValue({
      data: null,
      error: null,
    });
    const response = await GET(
      new Request("http://localhost/matches/missing/postcard"),
      {
        params: Promise.resolve({ id: "missing" }),
      },
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when the match is not played", async () => {
    buildMatchPostcardPayloadMock.mockResolvedValue({
      data: null,
      error: "Postcard is only available for played matches.",
    });
    const response = await GET(
      new Request("http://localhost/matches/match-1/postcard"),
      { params: Promise.resolve({ id: "match-1" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns a private PNG for a played match", async () => {
    buildMatchPostcardPayloadMock.mockResolvedValue({
      data: playedPayload,
      error: null,
    });
    const response = await GET(
      new Request("http://localhost/matches/match-1/postcard"),
      { params: Promise.resolve({ id: "match-1" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/image\/png/);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
