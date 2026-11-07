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
    const goals = readFileSync(
      path.join(import.meta.dirname, "goals-section.tsx"),
      "utf8",
    );
    expect(charts).toContain("statsChartFrameClassName()");
    // Goals draws its bars with the shared leader chart, inside the card frame.
    expect(goals).toContain("<PlayerLeaderChart");
    expect(charts).toMatch(
      /export function PlayerLeaderChart[\s\S]*?statsChartFrameClassName\(\)/,
    );
    expect(goals).not.toContain("<BarChart");
    // No hard-coded bar colour: the leader bars use the club colour.
    expect(goals).not.toContain("barFill");
    expect(charts).not.toContain("--color-chart-1");
  });
});
