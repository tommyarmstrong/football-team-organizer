import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { statsChartFrameClassName } from "@/components/stats/chart-frame";

describe("statsChartFrameClassName", () => {
  it("puts charts on a solid card so the pitch grid does not show through", () => {
    expect(statsChartFrameClassName()).toContain("bg-card");
    expect(statsChartFrameClassName()).toContain("rounded-2xl");
  });
});

describe("stats charts use the card frame", () => {
  it("wraps each chart figure", () => {
    const charts = readFileSync(
      path.join(import.meta.dirname, "stats-charts.tsx"),
      "utf8",
    );
    const page = readFileSync(
      path.join(import.meta.dirname, "stats-page-content.tsx"),
      "utf8",
    );
    expect(charts).toContain("statsChartFrameClassName()");
    // Player charts draw their bars with the shared leader chart, inside the card frame.
    expect(page).toContain("<PlayerLeaderChart");
    expect(charts).toMatch(
      /export function PlayerLeaderChart[\s\S]*?statsChartFrameClassName\(\)/,
    );
    expect(page).not.toContain("<BarChart");
    expect(charts).not.toContain("--color-chart-1");
  });
});
