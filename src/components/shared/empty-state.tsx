import type { ReactNode } from "react";
import { PitchGraphic } from "@/components/brand/pitch-graphic";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "border-primary/20 from-card to-secondary/40 relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-dashed bg-linear-to-br px-4 py-8",
        className,
      )}
    >
      <PitchGraphic className="text-primary/15 pointer-events-none absolute -right-6 -bottom-8 h-28 w-auto" />
      <div className="relative space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}
