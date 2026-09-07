import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      aria-hidden
    />
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SectionSkeleton({
  rows = 2,
  columns = 1,
}: {
  rows?: number;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={columns === 2 ? "grid gap-8 sm:grid-cols-2" : "space-y-3"}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: columns === 2 ? 2 : rows }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
