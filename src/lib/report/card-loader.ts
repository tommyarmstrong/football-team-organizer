/**
 * Loads the Player Gallery card images for the season report.
 *
 * Each card is a PNG rendered on request, and a full squad means a burst of
 * database-backed requests. Letting the browser fire them all at once made
 * some fail, and a plain `<img>` hides that. This loader:
 *
 * - fetches a few at a time (`concurrency`),
 * - retries failures with a growing delay (`retries`),
 * - keeps the image bytes as a blob URL, so printing never needs the network
 *   (the card route is `no-store`, so a print preview could otherwise re-fetch),
 * - reports a real status per card, including why a card failed.
 *
 * Framework-free so it can be unit tested; the React wiring is in
 * `components/report/report-cards.tsx`.
 */

export type CardStatus =
  | { state: "pending" }
  | { state: "loading"; attempt: number }
  | { state: "loaded"; src: string }
  | { state: "failed"; reason: string };

export type CardSnapshot = Readonly<Record<string, CardStatus>>;

export type CardSummary = {
  total: number;
  loaded: number;
  failed: number;
  /** Pending or loading. */
  inFlight: number;
  /** Distinct reasons for the failed cards, e.g. "HTTP 500". */
  failureReasons: string[];
};

export type CardLoaderOptions = {
  /** Requests in flight at once. */
  concurrency?: number;
  /** Extra attempts after the first one fails. */
  retries?: number;
  /** Delay before retry `n` is `retryDelayMs * n`. */
  retryDelayMs?: number;
  /** Give up on one request after this long. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
  wait?: (ms: number) => Promise<void>;
};

export type CardLoader = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CardSnapshot;
  /** Begin (or resume after `dispose`) loading every card that is not loaded. */
  start: () => void;
  /** Queue the failed cards again. */
  retryFailed: () => void;
  /** Stop, abort in-flight requests and free the blob URLs. */
  dispose: () => void;
};

export function summariseCards(snapshot: CardSnapshot): CardSummary {
  const statuses = Object.values(snapshot);
  const reasons = new Set<string>();
  let loaded = 0;
  let failed = 0;
  for (const status of statuses) {
    if (status.state === "loaded") loaded += 1;
    else if (status.state === "failed") {
      failed += 1;
      reasons.add(status.reason);
    }
  }
  return {
    total: statuses.length,
    loaded,
    failed,
    inFlight: statuses.length - loaded - failed,
    failureReasons: [...reasons],
  };
}

/** Why a request failed, in words a person can pass on. */
function describeFailure(error: unknown): string {
  if (error instanceof CardHttpError) return `HTTP ${error.status}`;
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "timed out";
  }
  return "network error";
}

class CardHttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export function createCardLoader(
  urls: readonly string[],
  options: CardLoaderOptions = {},
): CardLoader {
  const concurrency = Math.max(options.concurrency ?? 4, 1);
  const retries = Math.max(options.retries ?? 2, 0);
  const retryDelayMs = options.retryDelayMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const doFetch = options.fetchImpl ?? ((...args) => fetch(...args));
  const createObjectUrl =
    options.createObjectUrl ?? ((blob: Blob) => URL.createObjectURL(blob));
  const revokeObjectUrl =
    options.revokeObjectUrl ?? ((url: string) => URL.revokeObjectURL(url));
  const wait =
    options.wait ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const unique = [...new Set(urls)];
  const pendingSnapshot = (): Record<string, CardStatus> =>
    Object.fromEntries(unique.map((url) => [url, { state: "pending" }]));

  let snapshot: CardSnapshot = pendingSnapshot();
  const listeners = new Set<() => void>();
  let queue: string[] = [];
  let running = 0;
  // Bumped by dispose() so work from an earlier run is ignored.
  let generation = 0;
  let started = false;
  let controllers = new Set<AbortController>();

  function set(url: string, status: CardStatus) {
    snapshot = { ...snapshot, [url]: status };
    for (const listener of [...listeners]) listener();
  }

  async function fetchOnce(url: string, signal: AbortSignal): Promise<string> {
    const response = await doFetch(url, {
      credentials: "same-origin",
      signal,
    });
    if (!response.ok) throw new CardHttpError(response.status);
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new CardHttpError(response.status);
    return createObjectUrl(await response.blob());
  }

  async function load(url: string, runGeneration: number) {
    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      if (runGeneration !== generation) return;
      set(url, { state: "loading", attempt });

      const controller = new AbortController();
      controllers.add(controller);
      const timer = setTimeout(
        () => controller.abort(new DOMException("timeout", "TimeoutError")),
        timeoutMs,
      );
      try {
        const src = await fetchOnce(url, controller.signal);
        if (runGeneration !== generation) {
          revokeObjectUrl(src);
          return;
        }
        set(url, { state: "loaded", src });
        return;
      } catch (error) {
        if (runGeneration !== generation) return;
        if (attempt > retries) {
          set(url, { state: "failed", reason: describeFailure(error) });
          return;
        }
        await wait(retryDelayMs * attempt);
      } finally {
        clearTimeout(timer);
        controllers.delete(controller);
      }
    }
  }

  function pump() {
    const runGeneration = generation;
    while (running < concurrency && queue.length > 0) {
      const url = queue.shift()!;
      running += 1;
      void load(url, runGeneration).finally(() => {
        // A disposed run already reset `running`.
        if (runGeneration !== generation) return;
        running -= 1;
        pump();
      });
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    start() {
      if (started) return;
      started = true;
      queue = unique.filter((url) => snapshot[url]?.state !== "loaded");
      pump();
    },
    retryFailed() {
      if (!started) return;
      const failed = unique.filter((url) => snapshot[url]?.state === "failed");
      for (const url of failed) set(url, { state: "pending" });
      queue = [...queue, ...failed];
      pump();
    },
    dispose() {
      generation += 1;
      started = false;
      running = 0;
      queue = [];
      for (const controller of controllers) controller.abort();
      controllers = new Set();
      for (const status of Object.values(snapshot)) {
        if (status.state === "loaded") revokeObjectUrl(status.src);
      }
      snapshot = pendingSnapshot();
      for (const listener of [...listeners]) listener();
    },
  };
}
