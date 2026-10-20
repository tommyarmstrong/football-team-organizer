import { AwardIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fixed medal colours. These do not follow the club colour or theme primary. */
export const AWARD_TONE_CLASS = {
  gold: "text-[#E6B000]",
  silver: "text-[#8E979F]",
  bronze: "text-[#CD7F32]",
  black: "text-[#111111]",
} as const;

export type AwardTone = keyof typeof AWARD_TONE_CLASS;

export function awardToneForRank(rank: number): AwardTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "black";
}

export function AwardBadge({ tone }: { tone: AwardTone }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center",
        AWARD_TONE_CLASS[tone],
      )}
      aria-hidden="true"
    >
      <AwardIcon className="size-5" />
    </span>
  );
}
