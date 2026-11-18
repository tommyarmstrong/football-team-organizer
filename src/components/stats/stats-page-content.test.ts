import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "stats-page-content.tsx"),
  "utf8",
);
const filtersSource = readFileSync(
  path.join(import.meta.dirname, "stats-filters.tsx"),
  "utf8",
);

function sliceBetween(from: string, to: string): string {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start + from.length);
  return source.slice(start, end);
}

describe("StatsPageContent", () => {
  it("keeps league and cup as the default and remembers filters per team", () => {
    expect(source).toContain("usePersistentStatsFilters");
    expect(source).toContain("teamId");
    const hook = readFileSync(
      path.join(import.meta.dirname, "use-stats-filters.ts"),
      "utf8",
    );
    expect(hook).toContain("useSyncExternalStore");
    expect(hook).toContain("readStoredStatsFilters");
    expect(hook).toContain("writeStoredStatsFilters");
  });

  it("puts one Filters button beside the heading and chips under it", () => {
    const heading = sliceBetween(
      '<div className="space-y-3">',
      "<ResultRingCharts",
    );
    expect(heading).toContain("<PageHeader");
    expect(heading).toContain("<StatsFiltersButton");
    expect(heading).toContain("<StatsFilterChips");
    expect(heading.indexOf("<PageHeader")).toBeLessThan(
      heading.indexOf("<StatsFiltersButton"),
    );
    expect(source).not.toContain("<StatsCompetitionFilters");
    expect(source).not.toContain("<StatFilters");
  });

  it("opens a drawer on a phone and a popover on a larger screen", () => {
    expect(filtersSource).toContain("<Drawer");
    expect(filtersSource).toContain('className="md:hidden"');
    expect(filtersSource).toContain("<Popover");
    expect(filtersSource).toContain('className="hidden md:block"');
    expect(filtersSource).toContain("Reset");
    expect(filtersSource).toContain("Apply");
    expect(filtersSource).toContain('aria-label="Close filters"');
    expect(filtersSource).toContain("overflow-y-auto");
  });

  it("does not repeat Position controls outside the filter panel", () => {
    expect(source).not.toContain(">Position<");
    expect(filtersSource).toContain(">Position<");
    expect(source.match(/<StatsFiltersButton/g)).toHaveLength(1);
  });

  it("shares one chart for goals, assists and G+A", () => {
    const attacking = sliceBetween(
      "function AttackingStatsSection",
      "const ATTACKING_EMPTY",
    );
    expect(attacking).toContain('title="Attacking stats"');
    expect(attacking).toContain("ATTACKING_MODE_OPTIONS");
    expect(attacking).toContain("ATTACKING_METRIC_OPTIONS");
    expect(attacking).not.toContain("GOALS_METRIC_OPTIONS");
    expect(attacking).not.toContain("Per period");
    expect(attacking).toContain('aria-label="Attacking stat"');
    expect(attacking).toContain('aria-label="Attacking stat view"');
    expect(attacking).toContain('useState<AttackingMode>("goals")');
    expect(attacking).toContain('useState<GoalsMetric>("total")');
    expect(attacking).toContain("buildAttackingViewRows(");
    expect(attacking).toContain("positions");
    expect(attacking).toContain("<LeaderboardChart");
    expect(attacking).toContain('allowDecimals={metric !== "total"}');
    expect(source).not.toContain("<DashboardViewSwitch");
    expect(source).not.toContain("<PlayerCountChart");
  });

  it("keeps results and renames the goals scored and conceded chart", () => {
    expect(source).toContain('<Section title="Results" compact>');
    expect(source).toContain('<Section title="Goals" compact>');
    expect(source).toContain(
      '<Section title="Goals scored and conceded" compact>',
    );
    expect(source).not.toContain('title="Goal difference"');
    expect(source).toContain("<ResultsRingChart data={filteredResults} />");
    expect(source).toContain("<GoalsRingChart data={filteredResults} />");
    expect(source).toContain("<ResultsOverTimeChart data={filteredResults} />");
    expect(source).toContain("<GoalDifferenceChart data={filteredResults} />");
  });

  it("uses the same bars for awards as the other leaderboards", () => {
    const awards = sliceBetween(
      "function AwardsSection",
      "function CountLeaderboard",
    );
    expect(awards).toContain('label: "Player of the month"');
    expect(awards).toContain('label: "Player of the match"');
    expect(awards).toContain("coach's player of the match");
    expect(awards).toContain('<LeaderboardChart rows={rows} unit="awards" />');
    expect(awards).not.toContain("<RankedPlayerList");

    expect(source).toContain('title="Appearances"');
    expect(source).toContain("visibleLeaderRows");
    expect(source).toContain("<ShowAllToggle");
    expect(source).toContain("<PlayerLeaderChart");
  });

  it("shows Period starts only when the data is passed, with its own type", () => {
    expect(source).toContain("{periodStartsByPlayer ? (");
    const call = sliceBetween("{periodStartsByPlayer ? (", ") : null}");
    expect(call).toContain("<PeriodStartsSection");
    expect(call).toContain("data={periodStartsByPlayer}");
    expect(call).toContain("competitionId={competitionId}");
    expect(call).toContain("competitionKind={competitionKind}");
    expect(call).toContain("positions={positions}");

    const section = source.slice(
      source.indexOf("function PeriodStartsSection"),
    );
    expect(section).toContain('aria-label="Period type"');
    expect(section).toContain('aria-label="Period starts view"');
    expect(section).toContain("DEFAULT_PERIOD_TYPE_FILTER");
    expect(section).toContain('metric === "per_game" ? "per_game" : "total"');
    expect(section).toContain(
      "filterPeriodStarts(data, competitionId, competitionKind, periodType)",
    );
    expect(section).toContain("buildPeriodStartsViewRows(");
    expect(section).toContain("PERIODS_PER_GAME_PERCENT_LABEL");
    expect(section).not.toContain("positions=");
    expect(section).not.toContain("<StatFilters");
  });

  it("drops the headline cards and tightens the page", () => {
    expect(source).not.toContain("SeasonTiles");
    expect(source).not.toContain("W–D–L");
    expect(source).toContain('className="space-y-5"');
    const grid = sliceBetween(
      "function ResultRingCharts",
      "export function StatsPageContent",
    );
    expect(grid).toContain("lg:grid-cols-2");
    expect(grid).toContain("gap-5");
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
  });
});
