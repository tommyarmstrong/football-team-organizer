import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildPlayerCardPayloadMock, crestDataUrlMock, renderedBodyMock } =
  vi.hoisted(() => ({
    buildPlayerCardPayloadMock: vi.fn(),
    crestDataUrlMock: vi.fn(),
    renderedBodyMock: vi.fn<() => BodyInit>(() => "png-bytes"),
  }));

vi.mock("@/lib/postcards/player-card", () => ({
  buildPlayerCardPayload: buildPlayerCardPayloadMock,
}));

vi.mock("@/lib/postcards/crest", () => ({
  crestDataUrl: crestDataUrlMock,
}));

vi.mock("@/lib/postcards/player-card-image", () => ({
  PlayerCardImage: () => null,
  PLAYER_CARD_WIDTH: 1080,
  PLAYER_CARD_HEIGHT: 1350,
}));

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor() {
      super(renderedBodyMock(), { status: 200 });
    }
  },
}));

import { GET } from "@/app/(app)/people/[id]/player-card/route";

const payload = {
  playerId: "player-1",
  teamId: "team-1",
  clubIconUrl: "https://cdn.example/crest.png",
};

function call(query = "?player=player-1&team=team-1") {
  return GET(
    new Request(`http://localhost/people/person-1/player-card${query}`),
    {
      params: Promise.resolve({ id: "person-1" }),
    },
  );
}

describe("GET /people/[id]/player-card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crestDataUrlMock.mockResolvedValue("data:image/png;base64,AAAA");
  });

  it("returns 404 without a player parameter", async () => {
    const response = await call("");
    expect(response.status).toBe(404);
    expect(buildPlayerCardPayloadMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the card is missing or not allowed", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({ data: null, error: null });
    expect((await call()).status).toBe(404);
  });

  it("returns 404 when the payload fails to load", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({
      data: null,
      error: "boom",
    });
    expect((await call()).status).toBe(404);
  });

  it("passes the person, player, and team to the builder", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    await call();
    expect(buildPlayerCardPayloadMock).toHaveBeenCalledWith("player-1", {
      personId: "person-1",
      teamId: "team-1",
    });
    expect(crestDataUrlMock).toHaveBeenCalledWith(
      "https://cdn.example/crest.png",
      "http://localhost",
    );
  });

  it("lets the builder choose the team when none is requested", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    await call("?player=player-1");
    expect(buildPlayerCardPayloadMock).toHaveBeenCalledWith("player-1", {
      personId: "person-1",
      teamId: null,
    });
  });

  it("returns a private PNG", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/image\/png/);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 500 when the image body fails mid-render", async () => {
    buildPlayerCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    renderedBodyMock.mockImplementationOnce(
      () =>
        new ReadableStream({
          start(controller) {
            controller.error(new Error("satori layout error"));
          },
        }),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = await call();
    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});
