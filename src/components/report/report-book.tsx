import type { CSSProperties } from "react";
import { fillerPagesForEven } from "@/lib/report/paginate";
import { reportThemeVars } from "@/lib/report/colour";
import type { ReportData } from "@/lib/report/types";
import {
  AwardsPage,
  BackCoverPage,
  coachNotesPages,
  CompetitionsPage,
  CoverPage,
  GlancePage,
  lookingAheadPages,
  NotesPage,
  NumbersPage,
  resultsPages,
  squadPages,
} from "@/components/report/report-pages";

/**
 * The whole season book: an ordered list of A4 pages.
 *
 * Every page is a direct child of `.report-book` so the odd/even binding
 * margins in `report.css` line up with the printed page numbers. Blank "Notes"
 * pages are added before the back cover so a double-sided print ends cleanly.
 */
export function ReportBook({ data }: { data: ReportData }) {
  const body = [
    <CoverPage key="cover" data={data} />,
    ...coachNotesPages({ data }),
    <GlancePage key="glance" data={data} />,
    ...resultsPages({ data }),
    <NumbersPage key="numbers" data={data} />,
    <CompetitionsPage key="competitions" data={data} />,
    ...squadPages({ data }),
    <AwardsPage key="awards" data={data} />,
    ...lookingAheadPages({ data }),
  ];

  // +1 for the back cover.
  const fillers = fillerPagesForEven(body.length + 1);
  const filler = Array.from({ length: fillers }, (_, i) => (
    <NotesPage key={`notes-${i}`} data={data} />
  ));

  return (
    <div
      className="report-book"
      style={reportThemeVars(data.club.colour) as CSSProperties}
    >
      {body}
      {filler}
      <BackCoverPage key="back" data={data} />
    </div>
  );
}
