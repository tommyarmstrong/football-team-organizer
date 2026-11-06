import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One A4 sheet. Geometry, binding margins and page breaks come from
 * `report.css` (`.report-sheet`); this adds the running header and footer.
 *
 * `label` is the footer text ("Riverside Rangers FC · 2025/26"). The page
 * number is a CSS counter, so inserting a page renumbers the book.
 */
export function ReportPage({
  kicker,
  title,
  label,
  children,
  className,
}: {
  kicker?: string;
  title?: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("report-sheet flex flex-col", className)}
      aria-label={title ?? kicker}
    >
      <div className="flex min-h-0 flex-1 flex-col pt-[14mm] pr-(--pr) pb-[20mm] pl-(--pl)">
        {title ? <PageHeading kicker={kicker} title={title} /> : null}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      <footer className="absolute right-(--pr) bottom-[9mm] left-(--pl) flex items-center justify-between border-t border-(--club-line) pt-[2.5mm] text-[8pt] tracking-[0.12em] text-neutral-500 uppercase">
        <span>{label}</span>
        <span className="report-footer font-display text-[11pt] font-semibold tracking-normal text-(--club-ink)" />
      </footer>
    </section>
  );
}

export function PageHeading({
  kicker,
  title,
}: {
  kicker?: string;
  title: string;
}) {
  return (
    <header className="mb-[8mm]">
      {kicker ? (
        <p className="mb-[2mm] flex items-center gap-[3mm] text-[8.5pt] font-semibold tracking-[0.22em] text-(--club-ink) uppercase">
          <span className="inline-block h-[1.4mm] w-[10mm] rounded-full bg-(--club)" />
          {kicker}
        </p>
      ) : null}
      <h2 className="font-display text-[17mm] leading-[0.92] font-semibold tracking-[0.005em] text-neutral-900 uppercase">
        {title}
      </h2>
    </header>
  );
}

/** Pale panel used for stat tiles and cards. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[3mm] border border-(--club-line) bg-(--club-soft) p-[4.5mm]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-[3mm] text-[8pt] font-semibold tracking-[0.2em] text-(--club-ink) uppercase">
      {children}
    </h3>
  );
}

/** Shown where a hand-written markdown file has not been created yet. */
export function SlotPlaceholder({
  expectedPath,
  hint,
}: {
  expectedPath: string;
  hint: string;
}) {
  return (
    <div className="rounded-[3mm] border-[0.4mm] border-dashed border-(--club) bg-(--club-soft) p-[6mm] text-[10pt] text-neutral-700">
      <p className="font-display text-[15pt] tracking-wide text-(--club-ink) uppercase">
        Placeholder
      </p>
      <p className="mt-[2mm]">{hint}</p>
      <p className="mt-[3mm] font-mono text-[8.5pt] break-all text-neutral-600">
        {expectedPath}
      </p>
    </div>
  );
}
