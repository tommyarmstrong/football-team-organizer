import type { ReportSeasonAwards } from "@/lib/report/types";

/** The three whole-season awards shown on the Awards page, in print order. */
export const SEASON_AWARD_BOXES = [
  { key: "playerOfTheSeason", title: "Player of the season" },
  { key: "playersPlayer", title: "Player's player of the season" },
  { key: "mostImproved", title: "Most improved player of the season" },
] as const satisfies ReadonlyArray<{
  key: keyof Omit<ReportSeasonAwards, "expectedPath">;
  title: string;
}>;

/** No winners chosen yet. The boxes print blank, ready to write in. */
export function emptySeasonAwards(expectedPath: string): ReportSeasonAwards {
  return {
    expectedPath,
    playerOfTheSeason: null,
    playersPlayer: null,
    mostImproved: null,
  };
}

function winner(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Read the contents of `season-awards.json`. Anything unreadable (bad JSON,
 * wrong types, blank names) counts as "no winner yet" rather than an error, so
 * a typo never stops the whole report from opening.
 */
export function parseSeasonAwards(
  raw: string,
  expectedPath: string,
): ReportSeasonAwards {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptySeasonAwards(expectedPath);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return emptySeasonAwards(expectedPath);
  }
  const record = parsed as Record<string, unknown>;
  return {
    expectedPath,
    playerOfTheSeason: winner(record.playerOfTheSeason),
    playersPlayer: winner(record.playersPlayer),
    mostImproved: winner(record.mostImproved),
  };
}
