import type { CompetitionResult } from "@/lib/supabase/database.types";
import { COMPETITION_RESULT_LABELS } from "@/lib/constants";
import type { ListedCompetitionResult } from "@/components/team/competition-list-badge";
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
    className: "border-[#D4AF37] text-[#FFD12B]",
  },
  runner_up: {
    emoji: "🥈",
    text: "Runners up",
    className: "border-[#A8A9AD] text-[#D5D8DC]",
  },
  third_place: {
    emoji: "🥉",
    text: "3rd",
    className: "border-[#CD7F32] text-[#E8A86A]",
  },
  semi_final: {
    emoji: "🥉",
    text: "Semi",
    className: "border-[#CD7F32] text-[#E8A86A]",
  },
  promoted: {
    emoji: "🏆",
    text: "Promoted",
    className: "border-[#D4AF37] text-[#FFD12B]",
  },
};

const GREY_CHIP_CLASS = "border-muted-foreground/40 text-muted-foreground";

export function CompetitionResultChip({
  result,
}: {
  result: ListedCompetitionResult | null | undefined;
}) {
  if (!result || result === "none" || result === "ongoing") return null;

  if (result === "upcoming") {
    return (
      <RoleChip className={GREY_CHIP_CLASS}>
        <span>Upcoming</span>
      </RoleChip>
    );
  }

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
