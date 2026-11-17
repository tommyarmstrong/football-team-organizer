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
 * Equal-width action buttons in one row on phones (so a 3-button bar costs one
 * 44px line, not three); from sm it is the same content-sized row as
 * {@link stackedActionsRowClassName}.
 */
export function actionBarClassName(className?: string): string {
  return cn(
    "grid w-full grid-flow-col auto-cols-fr gap-2 sm:inline-grid sm:w-max sm:max-w-full",
    className,
  );
}

/** Button sizing for {@link actionBarClassName}: 44px on phones, 32px from sm. */
export function actionBarButtonClassName(className?: string): string {
  return cn("h-11 w-full min-w-0 px-2 sm:h-8 sm:px-2.5", className);
}
