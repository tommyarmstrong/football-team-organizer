import type { CompetitionResult } from "@/lib/supabase/database.types";
import { COMPETITION_RESULT_LABELS } from "@/lib/constants";
import { RoleChip } from "@/components/shared/role-chip";
import { cn } from "@/lib/utils";

type ChipStyle = {
  emoji?: string;
  text: string;
  className: string;
};

const RESULT_CHIPS: Partial<Record<CompetitionResult, ChipStyle>> = {
  champions: {
    emoji: "🏆",
    text: "Champions",
    className: "border-[#D4AF37] text-[#8a6d00]",
  },
  runner_up: {
    emoji: "🥈",
    text: "Runners up",
    className: "border-[#A8A9AD] text-[#5c5d61]",
  },
  third_place: {
    emoji: "🥉",
    text: "3rd",
    className: "border-[#CD7F32] text-[#8a4f12]",
  },
  semi_final: {
    emoji: "🥉",
    text: "Semi",
    className: "border-[#CD7F32] text-[#8a4f12]",
  },
  promoted: {
    emoji: "🏆",
    text: "Promoted",
    className: "border-[#D4AF37] text-[#8a6d00]",
  },
};

const GREY_CHIP_CLASS = "border-muted-foreground/40 text-muted-foreground";

export function CompetitionResultChip({
  result,
}: {
  result: CompetitionResult | null | undefined;
}) {
  if (!result || result === "none") return null;

  const styled = RESULT_CHIPS[result];
  if (styled) {
    return (
      <RoleChip className={cn(styled.className)}>
        {styled.emoji ? <span aria-hidden="true">{styled.emoji}</span> : null}
        <span>{styled.text}</span>
      </RoleChip>
    );
  }

  return (
    <RoleChip className={GREY_CHIP_CLASS}>
      <span>{COMPETITION_RESULT_LABELS[result]}</span>
    </RoleChip>
  );
}
