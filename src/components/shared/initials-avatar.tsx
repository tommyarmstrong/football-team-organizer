import { cn } from "@/lib/utils";

export function initialsFromName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

export function InitialsAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary/12 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        className,
      )}
    >
      {initialsFromName(name)}
    </span>
  );
}
