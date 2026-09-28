import { afterEach, describe, expect, it, vi } from "vitest";
import { crestDataUrl } from "@/lib/postcards/crest";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("crestDataUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inlines a raster crest as a data URL", async () => {
    const fetchMock = stubFetch(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png; charset=binary" },
      }),
    );
    const url = await crestDataUrl("https://cdn.example/crest.png", "http://x");
    expect(fetchMock).toHaveBeenCalledWith("https://cdn.example/crest.png");
    expect(url).toBe("data:image/png;base64,AQID");
  });

  it("resolves the default icon against the request origin", async () => {
    const fetchMock = stubFetch(
      new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } }),
    );
    expect(await crestDataUrl(null, "http://localhost:3000")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/football-icon.svg",
    );
  });

  it("returns null for failed, non-raster, or unreachable crests", async () => {
    stubFetch(new Response("nope", { status: 404 }));
    expect(
      await crestDataUrl("https://cdn.example/a.png", "http://x"),
    ).toBeNull();

    stubFetch(new Response("x", { headers: { "content-type": "text/html" } }));
    expect(
      await crestDataUrl("https://cdn.example/a.png", "http://x"),
    ).toBeNull();

    stubFetch(new Error("network down"));
    expect(
      await crestDataUrl("https://cdn.example/a.png", "http://x"),
    ).toBeNull();
  });
});
