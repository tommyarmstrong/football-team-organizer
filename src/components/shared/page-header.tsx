import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display min-w-0 flex-1 text-3xl leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <div className="text-muted-foreground text-sm">{description}</div>
      ) : null}
    </div>
  );
}
