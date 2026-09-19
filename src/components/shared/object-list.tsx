import { cn } from "@/lib/utils";

/** Paper list shell for object rows under a page section heading. */
export const objectListClassName =
  "bg-card divide-y divide-foreground/8 overflow-hidden rounded-2xl ring-1 ring-foreground/8 shadow-sm";

/** Clickable row body: hover highlight, full-width flex for inline info. */
export function objectListRowClassName(className?: string) {
  return cn(
    "hover:bg-primary/5 focus-visible:ring-ring flex min-h-11 min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
    className,
  );
}
