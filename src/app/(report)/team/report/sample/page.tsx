import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidClubColour } from "@/lib/clubs/branding";
import { readReportContent } from "@/lib/report/content";
import { REPORT_SAMPLE_SLUG } from "@/lib/report/slug";
import { sampleReportData } from "@/lib/report/sample";
import { PrintToolbar } from "@/components/report/print-toolbar";
import { ReportCardsProvider } from "@/components/report/report-cards";
import { cardUrls } from "@/lib/report/card-path";
import { ReportBook } from "@/components/report/report-book";

export const metadata: Metadata = { title: "Season report (sample)" };

/**
 * Design preview with fabricated data, so the report can be iterated on
 * without a database. Not available in production.
 *
 * Query options: `?colour=FFD400` (club colour), `?photo=1` (team photo),
 * `?content=0` (show the markdown placeholders), `?empty=1` (a team with no
 * matches, players or staff).
 */
export default async function SampleSeasonReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    colour?: string;
    photo?: string;
    content?: string;
    empty?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const colour = params.colour
    ? `#${params.colour.replace(/^#/, "")}`
    : undefined;
  const content = await readReportContent(
    params.content === "0" ? "_missing" : REPORT_SAMPLE_SLUG,
  );

  const data = sampleReportData(content, {
    colour: colour && isValidClubColour(colour) ? colour : undefined,
    withPhoto: params.photo === "1",
    empty: params.empty === "1",
  });

  return (
    <ReportCardsProvider urls={cardUrls(data)}>
      <PrintToolbar backHref="/team" />
      <div className="pt-[8mm] print:pt-0">
        <ReportBook data={data} />
      </div>
    </ReportCardsProvider>
  );
}
