import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "stats-page-content.tsx"),
  "utf8",
);

function sliceBetween(from: string, to: string): string {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start + from.length);
  return source.slice(start, end);
}

describe("StatsPageContent", () => {
  it("defaults competition type to all league and cup", () => {
    expect(source).toContain("ALL_LEAGUE_AND_CUP");
    expect(source).toContain("useState(ALL_LEAGUE_AND_CUP)");
    expect(source).toContain("withPlayedAppearanceCounts");
  });

  it("drops the headline cards", () => {
    expect(source).not.toContain("SeasonTiles");
    expect(source).not.toContain("W–D–L");
    expect(source).not.toContain('label: "Played"');
  });

  it("puts Position and View above the charts, once", () => {
    const filters = source.indexOf("<StatsCompetitionFilters");
    const playerFilters = source.indexOf("<StatFilters");
    const rings = source.indexOf("<ResultRingCharts");
    expect(filters).toBeGreaterThan(-1);
    expect(playerFilters).toBeGreaterThan(filters);
    expect(rings).toBeGreaterThan(playerFilters);

    const pageFilters = sliceBetween(
      "{showPlayerFilters ? (",
      "<ResultRingCharts",
    );
    expect(pageFilters).toContain("positions={positions}");
    expect(pageFilters).toContain("onPositionsChange={setPositions}");
    expect(pageFilters).toContain("metric={metric}");
    expect(pageFilters).toContain("onMetricChange={setMetric}");
    expect(pageFilters).toContain('metricAriaLabel="Stats view"');
    expect(pageFilters.match(/<StatFilters/g)).toHaveLength(1);
  });

  it("applies that Position and View to goals, assists, appearances and period starts", () => {
    expect(source).toContain("buildGoalsViewRows(");
    expect(source).toContain(
      "buildCountViewRows(assistsForView, positions, metric)",
    );
    expect(source).toContain(
      "buildCountViewRows(filteredAppearances, positions, metric)",
    );
    const periodCall = sliceBetween("{periodStartsByPlayer ? (", ") : null}");
    expect(periodCall).toContain("positions={positions}");
    expect(periodCall).toContain("metric={metric}");

    const players = sliceBetween(
      'title="Players"',
      "function PeriodStartsSection",
    );
    expect(players).not.toContain("<StatFilters");
  });

  it("combines goals, assists and appearances, keeping the leader bars", () => {
    const players = sliceBetween(
      'title="Players"',
      "{periodStartsByPlayer ? (",
    );
    expect(players).toContain('label: "Goals"');
    expect(players).toContain("rows={goalRows}");
    expect(players).toContain('label: "Assists"');
    expect(players).toContain("rows={assistRows}");
    expect(players).toContain('label: "Appearances"');
    expect(players).toContain("rows={appearanceRows}");
    expect(players.indexOf('label: "Goals"')).toBeLessThan(
      players.indexOf('label: "Assists"'),
    );
    expect(players.indexOf('label: "Assists"')).toBeLessThan(
      players.indexOf('label: "Appearances"'),
    );

    const chart = sliceBetween("function CountChart", "function AwardChart");
    expect(chart).toContain("<PlayerLeaderChart");
    expect(chart).toContain('valueKey="value"');
    expect(source).not.toContain("<PlayerCountChart");
    expect(source).not.toContain("<BarChart");
  });

  it("combines player of the month with the coach's player of the match", () => {
    const awards = sliceBetween('title="Awards"', 'title="Players"');
    expect(awards).toContain('label: "Player of the month"');
    expect(awards).toContain("rows={playerOfTheMonthByPlayer}");
    expect(awards).toContain('label: "Player of the match"');
    expect(awards).toContain("rows={filteredPotm}");
    expect(awards).toContain("coach's player of the match");
    expect(awards.indexOf("Player of the month")).toBeLessThan(
      awards.indexOf("Player of the match"),
    );
    expect(awards).not.toContain("players' player of the match");

    const chart = source.slice(source.indexOf("function AwardChart"));
    expect(chart).toContain("<PlayerLeaderChart");
    expect(chart).toContain('unit="awards"');

    const goalDifference = source.indexOf('title="Goal difference"');
    const awardsTitle = source.indexOf('title="Awards"');
    const playersTitle = source.indexOf('title="Players"');
    expect(awardsTitle).toBeGreaterThan(goalDifference);
    expect(playersTitle).toBeGreaterThan(awardsTitle);
  });

  it("uses the Goals section heading style for every Results heading", () => {
    expect(source).not.toContain("font-heading");
    expect(source).toContain('<Section title="Results">');
    expect(source).toContain('<Section title="Goals">');
    expect(source).toContain('<Section title="Goal difference">');
    expect(source).not.toContain("Goal Scorers");
  });

  it("shows Period starts only when the data is passed", () => {
    expect(source).toContain("{periodStartsByPlayer ? (");
    const call = sliceBetween("{periodStartsByPlayer ? (", ") : null}");
    expect(call).toContain("<PeriodStartsSection");
    expect(call).toContain("data={periodStartsByPlayer}");
    expect(call).toContain("competitionId={competitionId}");
    expect(call).toContain("competitionKind={competitionKind}");
    expect(call).not.toContain("<SideBySide>");
  });

  it("keeps Type on Period starts and follows the page view", () => {
    const section = source.slice(
      source.indexOf("function PeriodStartsSection"),
    );
    const filters = section.slice(
      section.indexOf("<StatFilters"),
      section.indexOf("/>", section.indexOf("<StatFilters")),
    );
    expect(filters).toContain("periodType={periodType}");
    expect(filters).toContain("onPeriodTypeChange={setPeriodType}");
    expect(filters).not.toContain("positions");
    expect(filters).not.toContain("metric");
    expect(section).toContain("DEFAULT_PERIOD_TYPE_FILTER");
    expect(section).toContain('metric === "per_game" ? "per_game" : "total"');
    expect(section).toContain(
      "filterPeriodStarts(data, competitionId, competitionKind, periodType)",
    );
    expect(section).toContain("buildPeriodStartsViewRows(");
    expect(section).toContain("PERIODS_PER_GAME_PERCENT_LABEL");
    expect(section).toContain("<PlayerLeaderChart");
    expect(section).toContain("percent={perGame}");
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

  it("draws the player charts as leader bars", () => {
    const charts = readFileSync(
      path.join(import.meta.dirname, "stats-charts.tsx"),
      "utf8",
    );
    expect(charts).not.toContain("PlayerCountChart");
    expect(charts).not.toContain("<BarChart");
    expect(source).toContain("<DashboardViewSwitch");
    expect(source.match(/<DashboardViewSwitch/g)).toHaveLength(2);
  });

  it("keeps the results and goals rings side by side on a large screen", () => {
    const grid = sliceBetween(
      "function ResultRingCharts",
      "export function StatsPageContent",
    );
    expect(grid).toContain("lg:grid-cols-2");
    expect(grid).not.toMatch(/(^|[ "])grid-cols-2/);
  });

  it("gives the Results chart a tooltip that works on touch", () => {
    const stats = readFileSync(
      path.join(import.meta.dirname, "stats-charts.tsx"),
      "utf8",
    );
    const chart = stats.slice(
      stats.indexOf("export function ResultsOverTimeChart"),
      stats.indexOf("export function ResultsRingChart"),
    );
    expect(chart).toContain("<PointsTrendWithTooltip");

    const tooltip = readFileSync(
      path.join(import.meta.dirname, "points-trend-chart.tsx"),
      "utf8",
    );
    expect(tooltip).toContain('"use client"');
    expect(tooltip).toContain("nativeTooltips={false}");
    expect(tooltip).toContain("onPointerMove");
    expect(tooltip).toContain("onPointerUp");
    expect(tooltip).toContain('addEventListener("pointerdown"');
  });
});
