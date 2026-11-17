"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { bindHeaderCollapse } from "@/lib/layout/header-collapse";
import { cn } from "@/lib/utils";

/**
 * Takes the place of the fixed phone header in the page flow. Its height is
 * the expanded header height (4.75rem) so the header never covers content and
 * collapsing never reflows the page.
 */
export const mobileHeaderSpacerClassName =
  "h-[calc(4.75rem+env(safe-area-inset-top))] shrink-0 md:hidden";

/** Shared by the live header and its Suspense fallback. */
export const appHeaderClassName = cn(
  "club-themed-header club-chrome text-header-foreground border-header/30 group/header z-30 border-b shadow-sm",
  // Desktop keeps the original sticky header.
  "md:sticky md:top-0",
  // Phones: fixed so the collapse does not change the page's scroll height.
  "max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:box-border max-md:overflow-hidden max-md:pt-[env(safe-area-inset-top)]",
  "max-md:h-[calc(4.75rem+env(safe-area-inset-top))]",
  "max-md:transition-[height] max-md:duration-200 max-md:ease-out motion-reduce:transition-none",
  "max-md:data-[collapsed=true]:h-[calc(3rem+env(safe-area-inset-top))]",
);

/** Phones centre the brand row in the fixed-height header; desktop is unchanged. */
export const headerInnerClassName =
  "mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 max-md:h-full max-md:justify-center max-md:py-0";

/** Name row that folds away (with its space) when the phone header collapses. */
export const brandNameRowClassName =
  "grid grid-rows-[1fr] transition-[grid-template-rows,opacity,visibility] duration-200 motion-reduce:transition-none max-md:group-data-[collapsed=true]/header:invisible max-md:group-data-[collapsed=true]/header:grid-rows-[0fr] max-md:group-data-[collapsed=true]/header:opacity-0";

/** 44px tap area around the team label without changing the header's height. */
export const teamTriggerClassName =
  "text-header-foreground/75 hover:text-header-foreground relative before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] max-md:group-data-[collapsed=true]/header:text-header-foreground max-md:group-data-[collapsed=true]/header:font-medium";

export function CollapsingHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return bindHeaderCollapse(element, window);
  }, []);

  return (
    <header
      ref={ref}
      data-slot="app-header"
      data-collapsed="false"
      className={cn(appHeaderClassName, className)}
    >
      {children}
    </header>
  );
}
