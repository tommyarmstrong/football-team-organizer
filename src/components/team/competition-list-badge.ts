import type { CompetitionResult } from "@/lib/supabase/database.types";

export type ListedCompetitionResult = CompetitionResult | "upcoming";

/** UTC calendar day, matching other "today" comparisons in the app. */
export function competitionListToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Badge for a competition row. Ongoing is left blank. A stored result such
 * as Completed shows, and a future date with no result yet shows Upcoming.
 */
export function listedCompetitionResult(
  competition: { result: CompetitionResult | null; date: string | null },
  today: string,
): ListedCompetitionResult | null {
  const result = competition.result;
  if (result && result !== "none" && result !== "ongoing") return result;
  const date = competition.date?.slice(0, 10);
  if (date && date > today) return "upcoming";
  return null;
}
