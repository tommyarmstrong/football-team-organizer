import { cn } from "@/lib/utils";

/** Bordered list shell for object rows under a page section heading. */
export const objectListClassName =
  "divide-border border-border/80 bg-card divide-y overflow-hidden rounded-2xl border shadow-sm";

/** Clickable row body: hover highlight, full-width flex for inline info. */
export function objectListRowClassName(className?: string) {
  return cn(
    "hover:bg-accent/50 focus-visible:ring-ring flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
    className,
  );
}
