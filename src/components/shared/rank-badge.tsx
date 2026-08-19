import { cn } from "@/lib/utils";

const RANK_CLASS: Record<number, string> = {
  1: "bg-draw text-draw-foreground shadow-sm",
  2: "bg-muted text-foreground ring-border ring-1 ring-inset",
  3: "bg-[#CD7F32]/20 text-[#8a4f12]",
};

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
        RANK_CLASS[rank] ?? "text-muted-foreground bg-muted",
      )}
    >
      {rank}
    </span>
  );
}
