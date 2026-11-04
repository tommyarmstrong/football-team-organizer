"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createCardLoader,
  summariseCards,
  type CardLoader,
  type CardStatus,
  type CardSummary,
} from "@/lib/report/card-loader";

const CardLoaderContext = createContext<CardLoader | null>(null);

const NO_CARDS: Readonly<Record<string, CardStatus>> = {};

/**
 * Owns the loading of every Player Gallery card in the book. Wrap the print
 * toolbar and the book in it: the toolbar reads progress, and each card tile
 * reads its own image. The server-rendered book is passed in as `children`.
 */
export function ReportCardsProvider({
  urls,
  children,
}: {
  urls: string[];
  children: ReactNode;
}) {
  // Same list in the same order gives the same loader.
  const key = urls.join("\n");
  const loader = useMemo(
    () => createCardLoader(key ? key.split("\n") : []),
    [key],
  );

  useEffect(() => {
    loader.start();
    // Frees the blob URLs and aborts requests when the page is left.
    return () => loader.dispose();
  }, [loader]);

  return (
    <CardLoaderContext.Provider value={loader}>
      {children}
    </CardLoaderContext.Provider>
  );
}

function useSnapshot() {
  const loader = useContext(CardLoaderContext);
  return useSyncExternalStore(
    (listener) => loader?.subscribe(listener) ?? (() => undefined),
    () => loader?.getSnapshot() ?? NO_CARDS,
    () => loader?.getSnapshot() ?? NO_CARDS,
  );
}

/** Progress for the print toolbar. */
export function useCardSummary(): CardSummary & { retryFailed: () => void } {
  const loader = useContext(CardLoaderContext);
  const snapshot = useSnapshot();
  return useMemo(
    () => ({
      ...summariseCards(snapshot),
      retryFailed: () => loader?.retryFailed(),
    }),
    [snapshot, loader],
  );
}

/**
 * The card image for one player. Renders nothing until the card has loaded
 * (or if it failed), so the placeholder card behind it shows instead.
 */
export function ReportCardImage({ url }: { url: string }) {
  const status = useSnapshot()[url];
  if (status?.state !== "loaded") return null;
  return (
    // Blob URL of a card the loader already fetched; nothing to optimise.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={status.src}
      alt=""
      data-report-card="loaded"
      className="absolute inset-0 size-full object-cover"
    />
  );
}
