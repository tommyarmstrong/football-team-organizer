import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLAYER_PHOTO_PLACEHOLDER_PATH,
  playerPhotoPlaceholderDataUrl,
} from "@/lib/postcards/player-photo";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("playerPhotoPlaceholderDataUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inlines the placeholder served from the request origin", async () => {
    const fetchMock = stubFetch(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const url = await playerPhotoPlaceholderDataUrl("http://localhost:3000");
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000${PLAYER_PHOTO_PLACEHOLDER_PATH}`,
    );
    expect(url).toBe("data:image/jpeg;base64,AQID");
  });

  it("returns null when the placeholder cannot be loaded", async () => {
    stubFetch(new Response("nope", { status: 404 }));
    expect(await playerPhotoPlaceholderDataUrl("http://x")).toBeNull();

    stubFetch(new Error("network down"));
    expect(await playerPhotoPlaceholderDataUrl("http://x")).toBeNull();
  });
});
