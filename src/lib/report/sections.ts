/**
 * The sections of the season book, in printed order. The book renders them in
 * this order, so moving a section here moves it in the report.
 *
 * Blank "Notes" pages, a blank inside back cover and the back cover always
 * follow the last section; the book adds them itself (see `notesPageCount`).
 * `coverInside` is the blank page behind the front cover, so the team info
 * starts on page 3.
 */
export const REPORT_SECTION_ORDER = [
  "cover",
  "coverInside",
  "teamInfo",
  "coachNotes",
  "glance",
  "numbers",
  "competitions",
  "gallery",
  "venues",
  "results",
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
  records: "Awards",
  lookingAhead: "Looking ahead",
  autographs: "Autographs",
} as const satisfies Partial<Record<ReportSectionId, string>>;

/** Venue cards per page (two columns by three rows). */
export const VENUES_PER_PAGE = 6;
