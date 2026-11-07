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

  it("gives assists the goal scorer filters and appearances the position filters only", () => {
    expect(source).toContain('metricNoun="Assists"');
    expect(source).toContain('metricAriaLabel="Assists metric"');
    expect(source).toContain('metricNoun="Matches"');
    const appearances = source.slice(
      source.indexOf('title="Appearances"'),
      source.indexOf("{periodStartsByPlayer ? ("),
    );
    expect(appearances).toContain("filtered={filteredAppearances}");
    expect(appearances).not.toContain("metricAriaLabel");
    expect(appearances).not.toContain("perGameLabel");
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
    const piesIndex = source.indexOf("<ResultRingCharts");
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

  it("gives Period starts position, Type and View filters, in that order", () => {
    const section = source.slice(
      source.indexOf("function PeriodStartsSection"),
    );
    const filters = section.slice(
      section.indexOf("<StatFilters"),
      section.indexOf("/>", section.indexOf("<StatFilters")),
    );
    expect(filters).toContain("onPositionsChange={setPositions}");
    expect(filters).toContain("periodType={periodType}");
    expect(filters).toContain("onPeriodTypeChange={setPeriodType}");
    expect(filters).toContain('metricAriaLabel="Period starts metric"');
    expect(filters).toContain("metricOptions={PERIOD_STARTS_METRIC_OPTIONS}");
    expect(section).toContain("DEFAULT_PERIOD_TYPE_FILTER");
    expect(section).toContain('useState<GoalsMetric>("total")');
  });

  it("shows Period starts as periods per game (%) from the filtered periods", () => {
    const section = source.slice(
      source.indexOf("function PeriodStartsSection"),
    );
    expect(section).toContain(
      "filterPeriodStarts(data, competitionId, competitionKind, periodType)",
    );
    expect(section).toContain("buildPeriodStartsViewRows(");
    expect(section).toContain("PERIODS_PER_GAME_PERCENT_LABEL");
    expect(section).toContain('perGameBasis="periods"');
    expect(section).toContain('percent={metric === "per_game"}');
  });

  it("passes the page competition filters to Period starts", () => {
    const section = source.slice(
      source.indexOf("{periodStartsByPlayer ? ("),
      source.indexOf("</>", source.indexOf("{periodStartsByPlayer ? (")),
    );
    expect(section).toContain("<PeriodStartsSection");
    expect(section).toContain("data={periodStartsByPlayer}");
    expect(section).toContain("competitionId={competitionId}");
    expect(section).toContain("competitionKind={competitionKind}");
  });

  it("names the goals section Goals", () => {
    const goals = readFileSync(
      path.join(import.meta.dirname, "goals-section.tsx"),
      "utf8",
    );
    expect(goals).toContain('<Section title="Goals">');
    expect(goals).not.toContain("Goal Scorers");
  });

  it("draws results and goals as rings, not pies", () => {
    expect(source).toContain("<ResultsRingChart data={filteredResults} />");
    expect(source).toContain("<GoalsRingChart data={filteredResults} />");
    expect(source).not.toContain("PieChart");
  });

  it("draws goal difference with the report's goals-per-match chart", () => {
    const stats = readFileSync(
      path.join(import.meta.dirname, "stats-charts.tsx"),
      "utf8",
    );
    const chart = stats.slice(
      stats.indexOf("export function GoalDifferenceChart"),
      stats.indexOf("export function ResultsOverTimeChart"),
    );
    expect(chart).toContain("<GoalsPerMatch");
    expect(chart).not.toContain("LineChart");
  });

  it("draws goals, assists and both awards as leader bars", () => {
    const goals = readFileSync(
      path.join(import.meta.dirname, "goals-section.tsx"),
      "utf8",
    );
    expect(goals).toContain("<PlayerLeaderChart");
    expect(goals).not.toContain("<PlayerCountChart");

    const awards = source.slice(
      source.indexOf('title="Player of the month"'),
      source.indexOf("<GoalsSection"),
    );
    expect(awards.match(/leaderboard/g)).toHaveLength(2);

    const assists = source.slice(
      source.indexOf('title="Assists"'),
      source.indexOf('title="Appearances"'),
    );
    expect(assists).toContain("leaderboard");
  });

  it("keeps the bar chart and table for appearances and period starts", () => {
    const appearances = source.slice(
      source.indexOf('title="Appearances"'),
      source.indexOf("{periodStartsByPlayer ? ("),
    );
    expect(appearances).not.toContain("leaderboard");
    const periods = source.slice(
      source.indexOf("function PeriodStartsSection"),
    );
    expect(periods).toContain("<PlayerCountChart");
  });

  it("puts the two awards, and goals and assists, side by side on desktop", () => {
    expect(source).toContain("function SideBySide");
    expect(source).toContain("lg:grid-cols-2");

    const pair = (from: string, to: string) =>
      source.slice(source.indexOf(from), source.indexOf(to));

    const awards = pair("<SideBySide>", "</SideBySide>");
    expect(awards).toContain('title="Player of the month"');
    expect(awards).toContain('title="Coach\'s player of the match"');
    expect(awards).not.toContain("<GoalsSection");

    const second = source.indexOf(
      "<SideBySide>",
      source.indexOf("</SideBySide>"),
    );
    const goalsAndAssists = source.slice(
      second,
      source.indexOf("</SideBySide>", second),
    );
    expect(goalsAndAssists).toContain("<GoalsSection");
    expect(goalsAndAssists).toContain('title="Assists"');
    expect(goalsAndAssists).not.toContain('title="Appearances"');
  });

  it("stacks the side-by-side sections on mobile and lets them shrink", () => {
    const grid = source.slice(source.indexOf("function SideBySide"));
    const classes = grid.slice(grid.indexOf('className="'), grid.indexOf('">'));
    // No columns below the lg breakpoint, so phones get one stacked column.
    expect(classes).not.toMatch(/(^|[ "])grid-cols-2/);
    expect(classes).toContain("lg:grid-cols-2");
    expect(classes).toContain("*:min-w-0");
  });
});
