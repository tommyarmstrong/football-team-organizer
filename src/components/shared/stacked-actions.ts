import { cn } from "@/lib/utils";

/**
 * Stack on mobile, row on desktop. `w-max` keeps the group as wide as the
 * longest label so buttons stay narrow instead of spanning the page.
 */
export function stackedActionsRowClassName(className?: string): string {
  return cn(
    "inline-grid w-max max-w-full grid-cols-1 justify-items-stretch gap-2 sm:grid-flow-col sm:auto-cols-fr",
    className,
  );
}

export function stackedActionButtonClassName(className?: string): string {
  return cn("w-full", className);
}

/** Wrap dialog triggers so they occupy one grid cell without stretching the row. */
export function stackedActionCellClassName(className?: string): string {
  return cn("flex w-full min-w-0", className);
}
