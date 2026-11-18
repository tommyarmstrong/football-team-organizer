import { afterEach, describe, expect, it, vi } from "vitest";
import { crestDataUrl, imageDataUrl } from "@/lib/postcards/crest";

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

  it("embeds the default football badge as a PNG without fetching the host", async () => {
    const fetchMock = stubFetch(new Response("unused"));
    const url = await crestDataUrl(null, "http://localhost:3000");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(url?.startsWith("data:image/png;base64,")).toBe(true);
    const bytes = Buffer.from(
      url!.slice("data:image/png;base64,".length),
      "base64",
    );
    expect(bytes.subarray(0, 4).toString("hex")).toBe("89504e47");
  });

  it("draws a remote SVG crest to PNG", async () => {
    stubFetch(
      new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="#111"/></svg>`,
        { headers: { "content-type": "image/svg+xml" } },
      ),
    );
    const url = await crestDataUrl("https://cdn.example/crest.svg", "http://x");
    expect(url?.startsWith("data:image/png;base64,")).toBe(true);
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

describe("imageDataUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inlines any raster image as a data URL", async () => {
    stubFetch(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/jpeg" },
      }),
    );
    expect(await imageDataUrl("http://x/a.jpg")).toBe(
      "data:image/jpeg;base64,AQID",
    );
  });

  it("returns null for failed, non-raster, or unreachable images", async () => {
    stubFetch(new Response("nope", { status: 500 }));
    expect(await imageDataUrl("http://x/a.jpg")).toBeNull();

    stubFetch(new Response("x", { headers: { "content-type": "text/html" } }));
    expect(await imageDataUrl("http://x/a.jpg")).toBeNull();

    stubFetch(new Error("network down"));
    expect(await imageDataUrl("http://x/a.jpg")).toBeNull();
  });
});
