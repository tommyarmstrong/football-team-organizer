import { cn } from "@/lib/utils";

const RANK_CLASS: Record<number, string> = {
  1: "bg-[#F5C518] text-[#3F2E00]",
  2: "bg-[#C0C6CE] text-[#1F252B]",
  3: "bg-[#CD7F32] text-[#2A1606]",
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
