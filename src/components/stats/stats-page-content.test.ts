import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "stats-page-content.tsx"),
  "utf8",
);

describe("StatsPageContent", () => {
  it("defaults competition type to all league and cup", () => {
    expect(source).toContain("ALL_LEAGUE_AND_CUP");
    expect(source).toContain("useState(ALL_LEAGUE_AND_CUP)");
    expect(source).toContain("withPlayedAppearanceCounts");
  });

  it("gives assists and appearances the goal scorer filters", () => {
    expect(source).toContain('metricNoun="Assists"');
    expect(source).toContain('metricAriaLabel="Assists metric"');
    expect(source).toContain('metricNoun="Matches"');
    expect(source).toContain('metricAriaLabel="Appearances metric"');
    const potm = source.slice(
      source.indexOf('title="Coach\'s player of the match"'),
      source.indexOf("<GoalsSection"),
    );
    expect(potm).not.toContain("metricNoun");
  });

  it("places player of the month between goal difference and coach awards", () => {
    const goalDifference = source.indexOf('title="Goal difference"');
    const monthly = source.indexOf('title="Player of the month"');
    const coach = source.indexOf('title="Coach\'s player of the match"');
    expect(goalDifference).toBeGreaterThan(-1);
    expect(monthly).toBeGreaterThan(goalDifference);
    expect(coach).toBeGreaterThan(monthly);

    const section = source.slice(monthly, coach);
    expect(section).toContain('metricLabel="Awards"');
    expect(section).toContain('ariaTitle="player of the month"');
    expect(section).toContain("filtered={playerOfTheMonthByPlayer}");
    expect(section).not.toContain("metricNoun");
  });

  it("uses the Goals section heading style for every Results heading", () => {
    expect(source).not.toContain("font-heading");
    expect(source).toContain('<Section title="Results">');
    expect(source).toContain('<Section title="Goals">');
    expect(source).toContain('<Section title="Goal difference">');
  });

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

  it("shows Period starts beneath Appearances, only when the data is passed", () => {
    const appearances = source.indexOf('title="Appearances"');
    const periodStarts = source.indexOf('title="Period starts"');
    expect(appearances).toBeGreaterThan(-1);
    expect(periodStarts).toBeGreaterThan(appearances);
    expect(source).toContain("{periodStartsByPlayer ? (");
  });

  it("gives Period starts position filters but no view toggle, with the Periods columns", () => {
    const section = source.slice(
      source.indexOf('title="Period starts"'),
      source.indexOf("</>", source.indexOf('title="Period starts"')),
    );
    expect(section).toContain('metricLabel="Periods"');
    expect(section).toContain('perGameLabel="Periods per game"');
    expect(section).toContain('metricNoun="Periods"');
    expect(section).toContain("filtered={periodStartsForView}");
    expect(section).not.toContain("metricAriaLabel");
  });

  it("applies the page competition filters and appearance counts to period starts", () => {
    expect(source).toMatch(
      /filterPlayerCountPoints\(\s*periodStartsByPlayer \?\? \[\],\s*competitionId,\s*competitionKind,?\s*\)/,
    );
    expect(source).toContain(
      "withPlayedAppearanceCounts(filteredPeriodStarts, filteredAppearances)",
    );
  });

  it("names the goals section Goals", () => {
    const goals = readFileSync(
      path.join(import.meta.dirname, "goals-section.tsx"),
      "utf8",
    );
    expect(goals).toContain('<Section title="Goals">');
    expect(goals).not.toContain("Goal Scorers");
  });
});
