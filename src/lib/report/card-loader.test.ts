import { describe, expect, it, vi } from "vitest";
import {
  createCardLoader,
  summariseCards,
  type CardLoader,
  type CardLoaderOptions,
} from "@/lib/report/card-loader";

type Reply = { status: number; type?: string } | "network";

function pngResponse(reply: Exclude<Reply, "network">) {
  return {
    ok: reply.status >= 200 && reply.status < 300,
    status: reply.status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type"
          ? (reply.type ?? "image/png")
          : null,
    },
    blob: async () => new Blob(["png"]),
  } as unknown as Response;
}

/** A fetch that answers from `replies[url]` (consumed in order, last repeats). */
function fakeFetch(replies: Record<string, Reply[]>) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const list = replies[url] ?? [{ status: 200 }];
    const reply = list.length > 1 ? list.shift()! : list[0]!;
    if (reply === "network") throw new TypeError("Failed to fetch");
    return pngResponse(reply);
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

function setup(
  urls: string[],
  replies: Record<string, Reply[]> = {},
  extra: CardLoaderOptions = {},
) {
  const { fetchImpl, calls } = fakeFetch(replies);
  const revoked: string[] = [];
  let next = 0;
  const loader = createCardLoader(urls, {
    fetchImpl,
    createObjectUrl: () => `blob:card-${(next += 1)}`,
    revokeObjectUrl: (url) => revoked.push(url),
    wait: async () => undefined,
    ...extra,
  });
  return { loader, calls, revoked, fetchImpl };
}

/** Resolve once the loader has nothing left in flight. */
async function settled(loader: CardLoader) {
  for (let i = 0; i < 200; i += 1) {
    if (summariseCards(loader.getSnapshot()).inFlight === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("loader never settled");
}

describe("createCardLoader", () => {
  it("starts every card as pending", () => {
    const { loader } = setup(["/a", "/b"]);
    expect(summariseCards(loader.getSnapshot())).toMatchObject({
      total: 2,
      loaded: 0,
      inFlight: 2,
    });
  });

  it("loads every card to a blob URL", async () => {
    const { loader } = setup(["/a", "/b", "/c"]);
    loader.start();
    await settled(loader);
    const summary = summariseCards(loader.getSnapshot());
    expect(summary).toMatchObject({ total: 3, loaded: 3, failed: 0 });
    expect(loader.getSnapshot()["/a"]).toEqual({
      state: "loaded",
      src: expect.stringMatching(/^blob:card-/),
    });
  });

  it("sends the session cookie", async () => {
    const { loader, fetchImpl } = setup(["/a"]);
    loader.start();
    await settled(loader);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/a",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("never has more than `concurrency` requests in flight", async () => {
    let active = 0;
    let peak = 0;
    const fetchImpl = (async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return pngResponse({ status: 200 });
    }) as unknown as typeof fetch;
    const loader = createCardLoader(
      Array.from({ length: 12 }, (_, i) => `/p${i}`),
      {
        fetchImpl,
        concurrency: 3,
        createObjectUrl: () => "blob:x",
        revokeObjectUrl: () => undefined,
        wait: async () => undefined,
      },
    );
    loader.start();
    await settled(loader);
    expect(peak).toBe(3);
    expect(summariseCards(loader.getSnapshot()).loaded).toBe(12);
  });

  it("retries a failed card and then loads it", async () => {
    const { loader, calls } = setup(["/a"], {
      "/a": [{ status: 500 }, "network", { status: 200 }],
    });
    loader.start();
    await settled(loader);
    expect(calls).toEqual(["/a", "/a", "/a"]);
    expect(loader.getSnapshot()["/a"]!.state).toBe("loaded");
  });

  it("reports why a card failed once retries run out", async () => {
    const { loader, calls } = setup(
      ["/ok", "/denied", "/down"],
      {
        "/denied": [{ status: 404 }],
        "/down": ["network"],
      },
      { retries: 1 },
    );
    loader.start();
    await settled(loader);
    const summary = summariseCards(loader.getSnapshot());
    expect(summary).toMatchObject({ loaded: 1, failed: 2, inFlight: 0 });
    expect(summary.failureReasons.sort()).toEqual([
      "HTTP 404",
      "network error",
    ]);
    // One try plus one retry each for the two failures.
    expect(calls.filter((url) => url === "/denied")).toHaveLength(2);
    expect(calls.filter((url) => url === "/down")).toHaveLength(2);
  });

  it("treats a non-image 200 (such as a login page) as a failure", async () => {
    const { loader } = setup(
      ["/a"],
      { "/a": [{ status: 200, type: "text/html" }] },
      { retries: 0 },
    );
    loader.start();
    await settled(loader);
    expect(loader.getSnapshot()["/a"]).toEqual({
      state: "failed",
      reason: "HTTP 200",
    });
  });

  it("retryFailed requeues only the failed cards", async () => {
    const { loader, calls } = setup(
      ["/ok", "/flaky"],
      { "/flaky": [{ status: 500 }, { status: 200 }] },
      { retries: 0 },
    );
    loader.start();
    await settled(loader);
    expect(summariseCards(loader.getSnapshot()).failed).toBe(1);

    loader.retryFailed();
    await settled(loader);
    expect(summariseCards(loader.getSnapshot())).toMatchObject({
      loaded: 2,
      failed: 0,
    });
    expect(calls).toEqual(["/ok", "/flaky", "/flaky"]);
  });

  it("deduplicates repeated URLs", async () => {
    const { loader, calls } = setup(["/a", "/a", "/b"]);
    loader.start();
    await settled(loader);
    expect(calls.sort()).toEqual(["/a", "/b"]);
    expect(summariseCards(loader.getSnapshot()).total).toBe(2);
  });

  it("notifies subscribers and stops after unsubscribe", async () => {
    const { loader } = setup(["/a"]);
    const listener = vi.fn();
    const unsubscribe = loader.subscribe(listener);
    loader.start();
    await settled(loader);
    expect(listener).toHaveBeenCalled();
    const calls = listener.mock.calls.length;
    unsubscribe();
    loader.dispose();
    expect(listener).toHaveBeenCalledTimes(calls);
  });

  it("changes the snapshot object on every update", async () => {
    const { loader } = setup(["/a"]);
    const before = loader.getSnapshot();
    loader.start();
    await settled(loader);
    expect(loader.getSnapshot()).not.toBe(before);
    expect(loader.getSnapshot()).toBe(loader.getSnapshot());
  });

  it("frees blob URLs on dispose and can start again (StrictMode)", async () => {
    const { loader, revoked, calls } = setup(["/a"]);
    loader.start();
    await settled(loader);
    loader.dispose();
    expect(revoked).toEqual(["blob:card-1"]);
    expect(loader.getSnapshot()["/a"]).toEqual({ state: "pending" });

    loader.start();
    await settled(loader);
    expect(loader.getSnapshot()["/a"]!.state).toBe("loaded");
    expect(calls).toEqual(["/a", "/a"]);
  });

  it("ignores a response that arrives after dispose", async () => {
    let release: (() => void) | undefined;
    const fetchImpl = (async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return pngResponse({ status: 200 });
    }) as unknown as typeof fetch;
    const revoked: string[] = [];
    const loader = createCardLoader(["/slow"], {
      fetchImpl,
      createObjectUrl: () => "blob:late",
      revokeObjectUrl: (url) => revoked.push(url),
      wait: async () => undefined,
    });
    loader.start();
    await new Promise((resolve) => setTimeout(resolve, 0));
    loader.dispose();
    release?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loader.getSnapshot()["/slow"]).toEqual({ state: "pending" });
    expect(revoked).toEqual(["blob:late"]);
  });

  it("starts only once until disposed", async () => {
    const { loader, calls } = setup(["/a"]);
    loader.start();
    loader.start();
    await settled(loader);
    expect(calls).toEqual(["/a"]);
  });
});

describe("summariseCards", () => {
  it("counts pending and loading as in flight", () => {
    expect(
      summariseCards({
        "/a": { state: "pending" },
        "/b": { state: "loading", attempt: 1 },
        "/c": { state: "loaded", src: "blob:c" },
        "/d": { state: "failed", reason: "HTTP 500" },
        "/e": { state: "failed", reason: "HTTP 500" },
      }),
    ).toEqual({
      total: 5,
      loaded: 1,
      failed: 2,
      inFlight: 2,
      failureReasons: ["HTTP 500"],
    });
  });
});
