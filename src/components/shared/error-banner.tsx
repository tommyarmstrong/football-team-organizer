import { cn } from "@/lib/utils";

export function ErrorBanner({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm",
        className,
      )}
    >
      {message}
    </div>
  );
}
