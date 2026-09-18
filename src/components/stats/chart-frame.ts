import { cn } from "@/lib/utils";

/** Solid card behind charts so the pitch grid does not show through. */
export function statsChartFrameClassName(className?: string) {
  return cn(
    "bg-card ring-foreground/10 space-y-4 overflow-hidden rounded-2xl p-3 shadow-sm ring-1 sm:p-4",
    className,
  );
}
