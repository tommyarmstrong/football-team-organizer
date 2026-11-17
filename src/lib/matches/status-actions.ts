import type { MatchStatus } from "@/lib/supabase/database.types";

/** Button/menu labels for the quick status controls on the match page. */
export const QUICK_STATUS_LABELS: Partial<Record<MatchStatus, string>> = {
  scheduled: "Scheduled",
  in_progress: "Kick off",
  played: "Full time",
  postponed: "Postponed",
  cancelled: "Cancelled",
};

export type MatchActionPlan = {
  /** The one prominent button. */
  primary: MatchStatus;
  /** Status changes offered in the Options menu, in display order. */
  menu: MatchStatus[];
};

/**
 * The quick status controls for a match, or null when there are none
 * (played, cancelled and postponed matches; a played match still gets the
 * period actions, see `matchOptionEntries`). One table drives both the match
 * page buttons and the server-side check, so they cannot disagree.
 */
export function matchActionPlan(status: MatchStatus): MatchActionPlan | null {
  if (status === "scheduled") {
    return {
      primary: "in_progress",
      menu: ["played", "cancelled", "postponed"],
    };
  }
  if (status === "in_progress") {
    return {
      primary: "played",
      menu: ["scheduled", "cancelled", "postponed"],
    };
  }
  return null;
}

export function canQuickSetStatus(
  current: MatchStatus,
  next: MatchStatus,
): boolean {
  const plan = matchActionPlan(current);
  return plan != null && (plan.primary === next || plan.menu.includes(next));
}

/** Label for a status control; "Kick off" is only the label of the in-progress move. */
export function quickStatusLabel(status: MatchStatus): string {
  return QUICK_STATUS_LABELS[status] ?? status;
}
