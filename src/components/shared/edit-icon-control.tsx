import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const editIconClassName =
  "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors";

export function EditIconLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(editIconClassName, className)}
    >
      <PencilIcon className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function EditIconButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(editIconClassName, className)}
    >
      <PencilIcon className="size-4" aria-hidden="true" />
    </button>
  );
}
