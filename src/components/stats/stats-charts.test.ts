import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayerCountChart } from "@/components/stats/stats-charts";

const rows = [
  {
    playerId: "1",
    name: "Ada Wing",
    count: 3,
    matchesPlayed: 2,
    periodsAvailable: 8,
    value: 37.5,
  },
  {
    playerId: "2",
    name: "Bea Def",
    count: 2,
    matchesPlayed: 2,
    periodsAvailable: 0,
    value: 0,
  },
];

function render(props: Partial<Parameters<typeof PlayerCountChart>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(PlayerCountChart, {
      data: rows,
      metricLabel: "Periods",
      ariaTitle: "period starts",
      ...props,
    }),
  );
}

describe("PlayerCountChart per game column", () => {
  it("divides by matches by default, to two decimals", () => {
    const html = render({ perGameLabel: "Periods per game" });
    expect(html).toContain(">Periods per game</th>");
    expect(html).toContain(">1.50</td>");
  });

  it("shows the percent of the periods in the player's games for the periods basis", () => {
    const html = render({
      perGameLabel: "Periods per game (%)",
      perGameBasis: "periods",
    });
    expect(html).toContain(">Periods per game (%)</th>");
    expect(html).toContain(">37.5%</td>");
    // No periods in their games: no percent.
    expect(html).toContain(">—</td>");
    expect(html).not.toContain(">1.50<");
  });

  it("describes plotted percents with a % sign", () => {
    const html = render({
      perGameLabel: "Periods per game (%)",
      perGameBasis: "periods",
      valueKey: "value",
      allowDecimals: true,
      percent: true,
      seriesLabel: "Periods per game (%)",
    });
    expect(html).toContain("Ada Wing: 37.5%");
  });

  it("describes plotted counts as plain numbers", () => {
    const html = render({
      perGameLabel: "Periods per game (%)",
      perGameBasis: "periods",
    });
    expect(html).toContain("Ada Wing: 3;");
  });
});
