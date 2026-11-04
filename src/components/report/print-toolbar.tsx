"use client";

import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Screen-only bar above the book (hidden when printing). The Print button
 * opens the browser print dialog; "Save as PDF" is a destination there.
 */
export function PrintToolbar({
  backHref,
  pageCountHint,
}: {
  backHref: string;
  pageCountHint?: string;
}) {
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
          {pageCountHint}
          In the print dialog choose <strong>A4</strong>, margins{" "}
          <strong>None</strong>, and tick <strong>Background graphics</strong>.
          Destination <strong>Save as PDF</strong> makes the file.
        </p>
        <Button type="button" onClick={() => window.print()}>
          <PrinterIcon aria-hidden="true" data-icon="inline-start" />
          Print / Save as PDF
        </Button>
      </div>
    </div>
  );
}
