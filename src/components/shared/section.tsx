import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Plain page section: heading + optional description + optional actions,
 * followed by content. Mirrors `PageHeader` at a smaller scale so pages can
 * stack several sections directly (no card chrome) — matching the Venues
 * and Matches list pages.
 *
 * `compact` tightens the gap between heading and content (12px instead of
 * 16px) for dense pages such as match details.
 */
export function Section({
  title,
  description,
  actions,
  compact = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(compact ? "space-y-3" : "space-y-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-display text-xl tracking-tight sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <div className="text-muted-foreground text-sm">{description}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
