import { AGE_GROUPS, type AgeGroup } from "@/lib/constants";
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

/**
 * Next consecutive season label, e.g. 2025/26 → 2026/27.
 * Returns null when the input is not a valid season.
 */
export function nextSeasonLabel(value: string): string | null {
  const match = SEASON_PATTERN.exec(value.trim());
  if (!match || !isValidSeasonLabel(value)) return null;
  const startYear = Number(match[1]) + 1;
  const endDigits = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}/${endDigits}`;
}

/**
 * Suggest the next age group for a season rollover (U10 → U11).
 * Adults and unknown values stay unchanged.
 */
export function suggestNextAgeGroup(ageGroup: string): AgeGroup | string {
  const index = (AGE_GROUPS as readonly string[]).indexOf(ageGroup);
  if (index < 0) return ageGroup;
  if (ageGroup === "Adults") return ageGroup;
  const next = AGE_GROUPS[index + 1];
  return next ?? ageGroup;
}

/** True when this season's team record has been archived. */
export function isTeamArchived(team: Pick<Team, "archived_at">): boolean {
  return team.archived_at != null;
}

/** Split teams into current and archived lists, preserving input order. */
export function partitionTeamsByArchiveStatus(teams: Team[]): {
  current: Team[];
  archived: Team[];
} {
  const current: Team[] = [];
  const archived: Team[] = [];
  for (const team of teams) {
    if (isTeamArchived(team)) archived.push(team);
    else current.push(team);
  }
  return { current, archived };
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
