import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  GoalDifferenceChart,
  GoalsRingChart,
  PlayerCountChart,
  PlayerLeaderChart,
  ResultsRingChart,
} from "@/components/stats/stats-charts";
import type { ResultOverTimePoint } from "@/lib/data/stats";

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

const results: ResultOverTimePoint[] = [
  {
    matchId: "m1",
    date: "2026-09-06",
    label: "Rovers",
    goalsFor: 3,
    goalsAgainst: 1,
    result: "W",
    competitionId: null,
    competitionKind: null,
    competitionName: null,
    isFriendly: false,
  },
  {
    matchId: "m2",
    date: "2026-09-13",
    label: "United",
    goalsFor: 1,
    goalsAgainst: 1,
    result: "D",
    competitionId: null,
    competitionKind: null,
    competitionName: null,
    isFriendly: false,
  },
  {
    matchId: "m3",
    date: "2026-09-20",
    label: "City",
    goalsFor: 0,
    goalsAgainst: 2,
    result: "L",
    competitionId: null,
    competitionKind: null,
    competitionName: null,
    isFriendly: false,
  },
];

describe("results and goals ring charts", () => {
  it("draws results in the report's ring format", () => {
    const html = renderToStaticMarkup(
      createElement(ResultsRingChart, { data: results }),
    );
    expect(html).toContain("1 wins, 1 draws, 1 losses");
    expect(html).toContain(">PLAYED</text>");
    expect(html).toContain(">Won<");
    expect(html).toContain("Wins 1, draws 1, losses 1");
    expect(html).not.toContain("recharts");
  });

  it("draws goals scored and conceded in the same format", () => {
    const html = renderToStaticMarkup(
      createElement(GoalsRingChart, { data: results }),
    );
    expect(html).toContain("4 goals scored, 4 goals conceded");
    expect(html).toContain(">Scored<");
    expect(html).toContain(">Conceded<");
    expect(html).toContain("Goals for 4, goals against 4");
    expect(html).not.toContain("recharts");
  });

  it("themes the report charts with the app colours", () => {
    const html = renderToStaticMarkup(
      createElement(ResultsRingChart, { data: results }),
    );
    expect(html).toContain("--club:var(--primary)");
  });
});

describe("GoalDifferenceChart", () => {
  it("uses the report's goals-per-match chart", () => {
    const html = renderToStaticMarkup(
      createElement(GoalDifferenceChart, { data: results }),
    );
    expect(html).toContain("Goals scored and conceded in each match");
    expect(html).toContain(">SCORED</text>");
    expect(html).toContain(">CONCEDED</text>");
    expect(html).toContain("2026-09-06 vs Rovers: 3-1");
    expect(html).not.toContain("recharts");
  });
});

describe("PlayerLeaderChart", () => {
  it("lists players as the report's leader bars, highest first", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerLeaderChart, { data: rows, unit: "goals" }),
    );
    expect(html.indexOf("Ada Wing")).toBeGreaterThan(-1);
    expect(html.indexOf("Ada Wing")).toBeLessThan(html.indexOf("Bea Def"));
    expect(html).toContain(">3<");
    expect(html).toContain(">2<");
    expect(html).toContain("goals");
    expect(html).toContain("width:100%");
  });

  it("plots the view value, formatted to two decimals for rates", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerLeaderChart, {
        data: [
          { ...rows[0]!, value: 1.5 },
          { ...rows[1]!, value: 1 },
        ],
        unit: "goals / game",
        valueKey: "value",
        allowDecimals: true,
      }),
    );
    expect(html).toContain(">1.50<");
    expect(html).toContain(">1.00<");
  });

  it("leaves out players on zero", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerLeaderChart, {
        data: [rows[0]!, { ...rows[1]!, count: 0 }],
        unit: "goals",
      }),
    );
    expect(html).toContain("Ada Wing");
    expect(html).not.toContain("Bea Def");
  });
});
