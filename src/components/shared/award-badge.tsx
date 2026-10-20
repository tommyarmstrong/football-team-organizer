import { AwardIcon } from "lucide-react";

export function AwardBadge() {
  return (
    <span
      className="bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full"
      aria-hidden="true"
    >
      <AwardIcon className="size-4" />
    </span>
  );
}
