import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEditTeam, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getActiveTeam } from "@/lib/data/team";
import { teamDisplayName } from "@/lib/format";
import { loadReportData } from "@/lib/report/load";
import { PrintToolbar } from "@/components/report/print-toolbar";
import { ReportBook } from "@/components/report/report-book";

// The browser uses the page title as the default PDF file name.
export async function generateMetadata(): Promise<Metadata> {
  const team = await getActiveTeam();
  return {
    title: team
      ? `${teamDisplayName(team)} season report ${team.season_label}`.replace(
          /\//g,
          "-",
        )
      : "Season report",
  };
}

/**
 * Season report for the active team, laid out as A4 pages and printed from
 * the browser. Managers only; everyone else is sent back to the team page.
 */
export default async function SeasonReportPage() {
  const [ctx, club, team] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    getActiveTeam(),
  ]);

  if (!ctx) redirect("/login");
  if (!team || !canEditTeam(ctx, team.id)) redirect("/team");

  const { data, error } = await loadReportData(team, club);

  if (!data) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <p className="text-destructive text-sm" role="alert">
          Could not build the season report: {error ?? "unknown error"}
        </p>
      </div>
    );
  }

  return (
    <>
      <PrintToolbar backHref="/team" />
      <div className="pt-[8mm] print:pt-0">
        <ReportBook data={data} />
      </div>
    </>
  );
}
