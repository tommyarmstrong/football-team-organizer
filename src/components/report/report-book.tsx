import type { CSSProperties, ReactElement } from "react";
import { notesPageCount } from "@/lib/report/paginate";
import { reportThemeVars } from "@/lib/report/colour";
import {
  REPORT_SECTION_ORDER,
  type ReportSectionId,
} from "@/lib/report/sections";
import type { ReportData } from "@/lib/report/types";
import {
  AutographsPage,
  BackCoverPage,
  BlankCoverPage,
  CompetitionsPage,
  CoverPage,
  GlancePage,
  NotesPage,
  NumbersPage,
  RecordsPage,
  TeamInfoPage,
  coachNotesPages,
  galleryPages,
  lookingAheadPages,
  resultsPages,
  venuesPages,
} from "@/components/report/report-pages";

/** How each section turns into one or more A4 pages. */
const SECTION_PAGES: Record<
  ReportSectionId,
  (data: ReportData) => ReactElement[]
> = {
  cover: (data) => [<CoverPage key="cover" data={data} />],
  coverInside: () => [
    <BlankCoverPage key="cover-inside" label="Inside cover" />,
  ],
  teamInfo: (data) => [<TeamInfoPage key="teamInfo" data={data} />],
  coachNotes: (data) => coachNotesPages({ data }),
  glance: (data) => [<GlancePage key="glance" data={data} />],
  numbers: (data) => [<NumbersPage key="numbers" data={data} />],
  gallery: (data) => galleryPages({ data }),
  competitions: (data) => [<CompetitionsPage key="competitions" data={data} />],
  venues: (data) => venuesPages({ data }),
  results: (data) => resultsPages({ data }),
  records: (data) => [<RecordsPage key="records" data={data} />],
  lookingAhead: (data) => lookingAheadPages({ data }),
  autographs: (data) => [<AutographsPage key="autographs" data={data} />],
};

/**
 * The whole season book: an ordered list of A4 pages. The order comes from
 * `REPORT_SECTION_ORDER`.
 *
 * Every page is a direct child of `.report-book` so the odd/even binding
 * margins in `report.css` line up with the printed page numbers. One or two
 * blank "Notes" pages go before the back cover so a double-sided print ends
 * cleanly. Both covers are double pages: a blank page follows the front cover
 * and another sits just before the back cover.
 */
export function ReportBook({ data }: { data: ReportData }) {
  const body = REPORT_SECTION_ORDER.flatMap((id) => SECTION_PAGES[id](data));

  const filler = Array.from({ length: notesPageCount(body.length) }, (_, i) => (
    <NotesPage key={`notes-${i}`} data={data} />
  ));

  return (
    <div
      className="report-book"
      style={reportThemeVars(data.club.colour) as CSSProperties}
    >
      {body}
      {filler}
      <BlankCoverPage key="back-inside" label="Inside back cover" subtle />
      <BackCoverPage key="back" data={data} />
    </div>
  );
}
