import { cn } from "@/lib/utils";

/** Stack on mobile, row on desktop; width follows the widest label. */
export function stackedActionsRowClassName(className?: string): string {
  return cn(
    "inline-grid grid-cols-1 gap-2 sm:grid-flow-col sm:auto-cols-fr",
    className,
  );
}

export function stackedActionButtonClassName(className?: string): string {
  return cn("w-full", className);
}
