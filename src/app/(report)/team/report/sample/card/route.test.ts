import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { photoDataUrlMock, imageProps } = vi.hoisted(() => ({
  photoDataUrlMock: vi.fn(),
  imageProps: vi.fn(),
}));

vi.mock("@/lib/postcards/player-photo", () => ({
  playerPhotoPlaceholderDataUrl: photoDataUrlMock,
}));

vi.mock("@/lib/postcards/player-card-image", () => ({
  PlayerCardImage: () => null,
  PLAYER_CARD_WIDTH: 1080,
  PLAYER_CARD_HEIGHT: 1350,
}));

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor(element: unknown, options: unknown) {
      super("png-bytes", { status: 200 });
      imageProps(element, options);
    }
  },
}));

import { GET } from "@/app/(report)/team/report/sample/card/route";

function call(query = "?player=sample-player-9") {
  return GET(new Request(`http://localhost/team/report/sample/card${query}`));
}

describe("GET /team/report/sample/card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    photoDataUrlMock.mockResolvedValue("data:image/jpeg;base64,BBBB");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is not available in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await call()).status).toBe(404);
    expect(imageProps).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown sample player", async () => {
    expect((await call("?player=nobody")).status).toBe(404);
    expect((await call("")).status).toBe(404);
  });

  it("renders a card PNG for a sample player", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(imageProps).toHaveBeenCalledTimes(1);
    const [, options] = imageProps.mock.calls[0]!;
    expect(options).toEqual({ width: 1080, height: 1350 });
  });

  it("applies a valid club colour and ignores an invalid one", async () => {
    await call("?player=sample-player-9&colour=FFD400");
    await call("?player=sample-player-9&colour=zzz");
    const colours = imageProps.mock.calls.map(
      ([element]) =>
        (element as { props: { payload: { clubColour: string } } }).props
          .payload.clubColour,
    );
    expect(colours).toEqual(["#FFD400", "#1D3A8A"]);
  });
});
