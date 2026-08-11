import type { Team } from "@/lib/supabase/database.types";

/** Preset seasons offered in season fields. */
export const SEASON_OPTIONS = [
  "2024/25",
  "2025/26",
  "2026/27",
  "2027/28",
] as const;

/** Default season for new teams and competitions. */
export const DEFAULT_SEASON = "2026/27";

const SEASON_PATTERN = /^(\d{4})\/(\d{2})$/;

/**
 * Season labels are start year / last two digits of the following year,
 * e.g. 2025/26 or 1965/66.
 */
export function isValidSeasonLabel(value: string): boolean {
  const match = SEASON_PATTERN.exec(value.trim());
  if (!match) return false;
  const startYear = Number(match[1]);
  const endDigits = match[2];
  const expected = String((startYear + 1) % 100).padStart(2, "0");
  return endDigits === expected;
}

export const SEASON_FORMAT_HINT =
  "Season must look like 2025/26 (start year / next year’s last two digits).";

/** True when this season's team record has been archived. */
export function isTeamArchived(team: Pick<Team, "archived_at">): boolean {
  return team.archived_at != null;
}

/** Active seasons first, then name, then newer season labels. */
export function sortTeamsForDisplay(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const aArchived = isTeamArchived(a) ? 1 : 0;
    const bArchived = isTeamArchived(b) ? 1 : 0;
    if (aArchived !== bArchived) return aArchived - bArchived;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return b.season_label.localeCompare(a.season_label);
  });
}
