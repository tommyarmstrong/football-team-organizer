"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Stop waiting for player cards after this long and allow printing anyway. */
const CARD_WAIT_LIMIT_MS = 45_000;

/**
 * Screen-only bar above the book (hidden when printing). The Print button
 * opens the browser print dialog; "Save as PDF" is a destination there.
 *
 * The Player Gallery cards are images rendered on request, so Print stays
 * disabled until every card (`img[data-report-card]`) has loaded; otherwise
 * the PDF could be saved with empty card slots.
 */
export function PrintToolbar({
  backHref,
  cardCount = 0,
}: {
  backHref: string;
  /** Number of player card images in the book. */
  cardCount?: number;
}) {
  const [loaded, setLoaded] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (cardCount === 0) return;
    let cancelled = false;
    const images = document.querySelectorAll<HTMLImageElement>(
      "img[data-report-card]",
    );
    images.forEach((image) => {
      // decode() settles once the image has loaded, or fails if it is broken.
      image
        .decode()
        .catch(() => undefined)
        .then(() => {
          if (!cancelled) setLoaded((count) => count + 1);
        });
    });
    const timer = setTimeout(() => setGaveUp(true), CARD_WAIT_LIMIT_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cardCount]);

  const ready = cardCount === 0 || loaded >= cardCount || gaveUp;

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-300 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to team
        </Link>
        <p className="text-muted-foreground hidden flex-1 text-xs sm:block">
          In the print dialog choose <strong>A4</strong>, margins{" "}
          <strong>None</strong>, and tick <strong>Background graphics</strong>.
          Destination <strong>Save as PDF</strong> makes the file.
        </p>
        <Button type="button" disabled={!ready} onClick={() => window.print()}>
          <PrinterIcon aria-hidden="true" data-icon="inline-start" />
          {ready
            ? "Print / Save as PDF"
            : `Loading player cards ${Math.min(loaded, cardCount)}/${cardCount}`}
        </Button>
      </div>
    </div>
  );
}
