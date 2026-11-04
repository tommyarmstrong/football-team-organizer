/**
 * The sections of the season book, in printed order. The book renders them in
 * this order, so moving a section here moves it in the report.
 */
export const REPORT_SECTION_ORDER = [
  "cover",
  "teamInfo",
  "coachNotes",
  "glance",
  "results",
  "numbers",
  "competitions",
  "venues",
  "gallery",
  "records",
  "lookingAhead",
  "autographs",
] as const;

export type ReportSectionId = (typeof REPORT_SECTION_ORDER)[number];

/** Page titles for the sections that have one. */
export const REPORT_SECTION_TITLES = {
  teamInfo: "Team info",
  coachNotes: "Coach's notes",
  glance: "Season at a glance",
  results: "Results",
  numbers: "The season in numbers",
  competitions: "Competitions",
  venues: "Venues",
  gallery: "Player Gallery",
  records: "Records",
  lookingAhead: "Looking ahead",
  autographs: "Autographs",
} as const satisfies Partial<Record<ReportSectionId, string>>;

/** Venue cards per page (two columns by three rows). */
export const VENUES_PER_PAGE = 6;
