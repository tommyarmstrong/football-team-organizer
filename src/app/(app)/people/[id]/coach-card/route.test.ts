import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buildCoachCardPayloadMock,
  crestDataUrlMock,
  photoDataUrlMock,
  renderedBodyMock,
} = vi.hoisted(() => ({
  buildCoachCardPayloadMock: vi.fn(),
  crestDataUrlMock: vi.fn(),
  photoDataUrlMock: vi.fn(),
  renderedBodyMock: vi.fn<() => BodyInit>(() => "png-bytes"),
}));

vi.mock("@/lib/postcards/coach-card", () => ({
  buildCoachCardPayload: buildCoachCardPayloadMock,
}));

vi.mock("@/lib/postcards/crest", () => ({
  crestDataUrl: crestDataUrlMock,
}));

vi.mock("@/lib/postcards/player-photo", () => ({
  playerPhotoPlaceholderDataUrl: photoDataUrlMock,
}));

vi.mock("@/lib/postcards/coach-card-image", () => ({
  CoachCardImage: () => null,
  COACH_CARD_WIDTH: 1080,
  COACH_CARD_HEIGHT: 1350,
}));

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor() {
      super(renderedBodyMock(), { status: 200 });
    }
  },
}));

import { GET } from "@/app/(app)/people/[id]/coach-card/route";

const payload = {
  coachId: "coach-1",
  teamId: "team-1",
  clubIconUrl: "https://cdn.example/crest.png",
};

function call(query = "?coach=coach-1&team=team-1") {
  return GET(
    new Request(`http://localhost/people/person-1/coach-card${query}`),
    {
      params: Promise.resolve({ id: "person-1" }),
    },
  );
}

describe("GET /people/[id]/coach-card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crestDataUrlMock.mockResolvedValue("data:image/png;base64,AAAA");
    photoDataUrlMock.mockResolvedValue("data:image/jpeg;base64,BBBB");
  });

  it("returns 404 without a coach parameter", async () => {
    const response = await call("");
    expect(response.status).toBe(404);
    expect(buildCoachCardPayloadMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the card is missing or not allowed", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({ data: null, error: null });
    expect((await call()).status).toBe(404);
  });

  it("returns 404 when the payload fails to load", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
      data: null,
      error: "boom",
    });
    expect((await call()).status).toBe(404);
  });

  it("passes the person, coach, and team to the builder", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    await call();
    expect(buildCoachCardPayloadMock).toHaveBeenCalledWith("coach-1", {
      personId: "person-1",
      teamId: "team-1",
    });
    expect(crestDataUrlMock).toHaveBeenCalledWith(
      "https://cdn.example/crest.png",
      "http://localhost",
    );
    expect(photoDataUrlMock).toHaveBeenCalledWith();
  });

  it("still renders when the placeholder artwork cannot load", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    photoDataUrlMock.mockResolvedValue(null);
    expect((await call()).status).toBe(200);
  });

  it("lets the builder choose the team when none is requested", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    await call("?coach=coach-1");
    expect(buildCoachCardPayloadMock).toHaveBeenCalledWith("coach-1", {
      personId: "person-1",
      teamId: null,
    });
  });

  it("returns a private PNG", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
      data: payload,
      error: null,
    });
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/image\/png/);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 500 when the image body fails mid-render", async () => {
    buildCoachCardPayloadMock.mockResolvedValue({
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
