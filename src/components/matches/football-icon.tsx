import { DEFAULT_CLUB_ICON_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The supplied football graphic (`public/football-icon.svg`), used as the goal marker. */
export function FootballIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local SVG
    <img
      src={DEFAULT_CLUB_ICON_SRC}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      className={cn("size-4 shrink-0", className)}
    />
  );
}
