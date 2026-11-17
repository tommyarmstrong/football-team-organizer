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

/**
 * The "primary button + Options" row used under the match card and under
 * Goals: the primary action fills the row on phones, Options stays compact.
 */
export function primaryActionRowClassName(className?: string): string {
  return cn("flex items-center gap-2", className);
}

/** Primary action: 44px and flexible on phones, content-sized 32px from sm. */
export function primaryActionButtonClassName(className?: string): string {
  return cn("h-11 min-w-0 flex-1 sm:h-8 sm:flex-none", className);
}

/** The secondary "Options" trigger next to a primary action. */
export function optionsButtonClassName(className?: string): string {
  return cn("h-11 px-3 sm:h-8 sm:px-2.5", className);
}
