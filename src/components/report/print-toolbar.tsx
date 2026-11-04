"use client";

import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCardSummary } from "@/components/report/report-cards";

/**
 * Screen-only bar above the book (hidden when printing). The Print button
 * opens the browser print dialog; "Save as PDF" is a destination there.
 *
 * The Player Gallery cards are images rendered on request. Print stays
 * disabled while they load. If some fail even after retries, printing is
 * still allowed (those tiles show a placeholder) but the bar says how many
 * failed and why, and offers a retry.
 */
export function PrintToolbar({ backHref }: { backHref: string }) {
  const cards = useCardSummary();
  const loading = cards.inFlight > 0;

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
        <div className="text-muted-foreground hidden min-w-0 flex-1 text-xs sm:block">
          {cards.failed > 0 && !loading ? (
            <p role="alert" className="text-destructive">
              {cards.failed} of {cards.total} player cards could not be loaded (
              {cards.failureReasons.join(", ")}). Those slots will print as
              plain placeholders.
            </p>
          ) : (
            <p>
              In the print dialog choose <strong>A4</strong>, margins{" "}
              <strong>None</strong>, and tick{" "}
              <strong>Background graphics</strong>. Destination{" "}
              <strong>Save as PDF</strong> makes the file.
            </p>
          )}
        </div>
        {cards.failed > 0 && !loading ? (
          <Button type="button" variant="outline" onClick={cards.retryFailed}>
            <RefreshCwIcon aria-hidden="true" data-icon="inline-start" />
            Retry {cards.failed}
          </Button>
        ) : null}
        <Button type="button" disabled={loading} onClick={() => window.print()}>
          <PrinterIcon aria-hidden="true" data-icon="inline-start" />
          {loading
            ? `Loading player cards ${cards.loaded}/${cards.total}`
            : "Print / Save as PDF"}
        </Button>
      </div>
    </div>
  );
}
