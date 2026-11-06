/** Lower-case, hyphen-separated, ASCII-only. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Folder name under `content/reports/` for a team's season, e.g. team
 * "U10 Lions" in season "2025/26" → `u10-lions-2025-26`.
 */
export function reportSlug(team: {
  name: string;
  season_label: string;
}): string {
  return [slugify(team.name), slugify(team.season_label)]
    .filter(Boolean)
    .join("-");
}

export const REPORT_CONTENT_ROOT = "content/reports";
export const REPORT_SAMPLE_SLUG = "_sample";

export const REPORT_SLOT_FILES = {
  coachNotes: "coach-notes.md",
  lookingAhead: "looking-ahead.md",
} as const;

export function reportSlotPath(
  slug: string,
  slot: keyof typeof REPORT_SLOT_FILES,
): string {
  return `${REPORT_CONTENT_ROOT}/${slug}/${REPORT_SLOT_FILES[slot]}`;
}
