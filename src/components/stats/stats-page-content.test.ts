import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "stats-page-content.tsx"),
  "utf8",
);

describe("StatsPageContent", () => {
  it("shows season tiles under the filters using the filtered results", () => {
    const filtersIndex = source.indexOf("<StatsCompetitionFilters");
    const tilesIndex = source.indexOf(
      "<SeasonTiles results={filteredResults} />",
    );
    const piesIndex = source.indexOf("<ResultPieCharts");
    expect(filtersIndex).toBeGreaterThan(-1);
    expect(tilesIndex).toBeGreaterThan(filtersIndex);
    expect(piesIndex).toBeGreaterThan(tilesIndex);
  });
});
