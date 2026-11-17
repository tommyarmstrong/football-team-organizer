import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ResultOverTimePoint } from "@/lib/data/stats";
import { SeasonTiles } from "@/components/stats/season-tiles";

const results: ResultOverTimePoint[] = [
  {
    matchId: "m1",
    date: "2026-01-01",
    label: "Rivals",
    goalsFor: 2,
    goalsAgainst: 1,
    result: "W",
    competitionId: "c1",
    competitionKind: "league",
    competitionName: "League",
    isFriendly: false,
  },
];

function tileClass(html: string, label: string): string {
  const start = html.indexOf(`>${label}<`);
  const open = html.lastIndexOf("<div", start);
  const end = html.indexOf(">", open);
  return html.slice(open, end);
}

describe("SeasonTiles glance layout", () => {
  it("shortens the cards and hides Played and Goal difference on a phone", () => {
    const html = renderToStaticMarkup(
      createElement(SeasonTiles, { results, variant: "glance" }),
    );
    expect(tileClass(html, "Played")).toContain("hidden");
    expect(tileClass(html, "Played")).toContain("md:flex");
    expect(tileClass(html, "Goal difference")).toContain("hidden");
    expect(html).toContain("md:grid-cols-4");
    expect(tileClass(html, "W–D–L")).not.toContain("hidden");
    expect(tileClass(html, "Goals")).not.toContain("hidden");
    expect(html).toContain("rounded-lg");
    expect(html).toContain("min-h-12");
    expect(html).toContain("text-2xl");
    expect(html).not.toContain("rounded-2xl");
    expect(html).not.toContain("min-h-[4.5rem]");
  });

  it("keeps the taller cards on the stats page", () => {
    const html = renderToStaticMarkup(createElement(SeasonTiles, { results }));
    expect(html).toContain("rounded-2xl");
    expect(html).toContain("min-h-[4.5rem]");
    expect(html).toContain("text-3xl");
    expect(tileClass(html, "Played")).not.toContain("hidden");
    expect(tileClass(html, "Goal difference")).not.toContain("hidden");
  });
});
