import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ChartTheme,
  goalDifferenceFill,
  GoalsDonut,
  GoalsLegend,
  GoalsPerMatch,
  LeaderBars,
  PointsTrend,
  ResultsDonut,
  ResultsLegend,
} from "@/components/report/report-charts";

describe("ring charts", () => {
  it("keeps the results ring and legend as the report prints them", () => {
    const tally = { wins: 3, draws: 1, losses: 2 };
    const ring = renderToStaticMarkup(createElement(ResultsDonut, { tally }));
    expect(ring).toContain("3 wins, 1 draws, 2 losses");
    expect(ring).toContain(">6</text>");
    expect(ring).toContain(">PLAYED</text>");

    const legend = renderToStaticMarkup(
      createElement(ResultsLegend, { tally }),
    );
    expect(legend).toContain(">Won<");
    expect(legend).toContain(">Drawn<");
    expect(legend).toContain(">Lost<");
  });

  it("draws goals scored and conceded in the same ring format", () => {
    const ring = renderToStaticMarkup(
      createElement(GoalsDonut, { goalsFor: 7, goalsAgainst: 3 }),
    );
    expect(ring).toContain("7 goals scored, 3 goals conceded");
    expect(ring).toContain(">10</text>");
    expect(ring).toContain(">GOALS</text>");
    // Track plus one arc each for scored and conceded.
    expect(ring.match(/<circle/g)).toHaveLength(3);

    const legend = renderToStaticMarkup(
      createElement(GoalsLegend, { goalsFor: 7, goalsAgainst: 3 }),
    );
    expect(legend).toContain(">Scored<");
    expect(legend).toContain(">Conceded<");
  });

  it("keeps the printed total when no centre value is passed", () => {
    const ring = renderToStaticMarkup(
      createElement(GoalsDonut, { goalsFor: 7, goalsAgainst: 3 }),
    );
    expect(ring).toContain(">10</text>");
    expect(ring).toContain('fill="var(--chart-ink, #14201a)"');
    expect(ring).not.toContain(">GD</text>");
  });

  it("uses the win, draw and loss shades for a goal difference", () => {
    expect(goalDifferenceFill(4)).toBe("var(--chart-win, #1c8a4e)");
    expect(goalDifferenceFill(0)).toBe("var(--chart-draw, #e0a526)");
    expect(goalDifferenceFill(-2)).toBe("var(--chart-loss, #cf4437)");

    const ring = renderToStaticMarkup(
      createElement(GoalsDonut, {
        goalsFor: 7,
        goalsAgainst: 3,
        centreValue: "+4",
        centreLabel: "GD",
        centreColour: goalDifferenceFill(4),
      }),
    );
    expect(ring).toContain(">+4</text>");
    expect(ring).toContain(">GD</text>");
    expect(ring).toContain("goal difference +4");
    expect(ring).toContain('fill="var(--chart-win, #1c8a4e)"');
    expect(ring).not.toContain(">10</text>");
  });

  it("draws one arc when only one side has goals", () => {
    const ring = renderToStaticMarkup(
      createElement(GoalsDonut, { goalsFor: 4, goalsAgainst: 0 }),
    );
    expect(ring.match(/<circle/g)).toHaveLength(2);
  });
});

describe("GoalsPerMatch", () => {
  it("accepts matches with only an id and the score", () => {
    const html = renderToStaticMarkup(
      createElement(GoalsPerMatch, {
        matches: [
          { id: "a", goalsFor: 3, goalsAgainst: 1 },
          { id: "b", goalsFor: 0, goalsAgainst: 2 },
        ],
      }),
    );
    expect(html).toContain("Goals scored and conceded in each match");
    // One scored and one conceded bar per match.
    expect(html.match(/<rect/g)).toHaveLength(4);
  });

  it("renders nothing without matches", () => {
    expect(
      renderToStaticMarkup(createElement(GoalsPerMatch, { matches: [] })),
    ).toBe("");
  });
});

describe("LeaderBars", () => {
  const rows = [
    { playerId: "1", name: "Ada", value: 4 },
    { playerId: "2", name: "Bea", value: 2, display: "2.00" },
  ];

  it("shows the value, or the display text when given", () => {
    const html = renderToStaticMarkup(
      createElement(LeaderBars, { rows, unit: "goals", emptyText: "None" }),
    );
    expect(html).toContain(">4<");
    expect(html).toContain(">2.00<");
    expect(html).toContain("width:100%");
    expect(html).toContain("width:50%");
  });

  it("sets the name and value column widths", () => {
    const html = renderToStaticMarkup(
      createElement(LeaderBars, {
        rows,
        unit: "goals",
        emptyText: "None",
        nameWidth: "40mm",
        valueWidth: "13mm",
      }),
    );
    expect(html).toContain("grid-template-columns:40mm 1fr 13mm");
  });

  it("shows the empty text without rows", () => {
    const html = renderToStaticMarkup(
      createElement(LeaderBars, {
        rows: [],
        unit: "goals",
        emptyText: "No goals recorded.",
      }),
    );
    expect(html).toContain("No goals recorded.");
  });
});

describe("ChartTheme", () => {
  it("maps the report colours onto the app theme", () => {
    const html = renderToStaticMarkup(
      createElement(ChartTheme, null, createElement("span", null, "x")),
    );
    expect(html).toContain("--club:var(--primary)");
    expect(html).toContain("--chart-grid:var(--border)");
    expect(html).toContain("--chart-ink:var(--foreground)");
    expect(html).toContain("--chart-win:var(--win)");
    expect(html).toContain("--chart-draw:var(--draw)");
    expect(html).toContain("--chart-loss:var(--loss)");
  });
});

describe("PointsTrend", () => {
  const trend = [
    {
      id: "a",
      date: "2026-09-06",
      opponent: "Rovers",
      goalsFor: 2,
      goalsAgainst: 0,
      result: "W" as const,
    },
    {
      id: "b",
      date: "2026-10-04",
      opponent: "United",
      goalsFor: 1,
      goalsAgainst: 1,
      result: "D" as const,
    },
  ];

  it("keeps the printed result colours when the app chart theme is absent", () => {
    const html = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend }),
    );
    expect(html).toContain("var(--chart-win, #1c8a4e)");
    expect(html).toContain("var(--chart-draw, #e0a526)");
    expect(html).toContain("var(--chart-point-stroke, #fff)");
    expect(html).not.toContain("--chart-win:var(--win)");
  });

  it("plots the running points and a tooltip for each match", () => {
    const html = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend }),
    );
    expect(html).toContain("<title>");
    expect(html).toContain("vs Rovers: W 2–0 · 3 pts");
    expect(html).toContain("vs United: D 1–1 · 4 pts");
    // Month ticks come from the match dates.
    expect(html).toContain(">SEP</text>");
    expect(html).toContain(">OCT</text>");
  });

  it("tags each point with its index, for the Stats page tooltip", () => {
    const html = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend }),
    );
    expect(html).toContain('data-point="0"');
    expect(html).toContain('data-point="1"');
  });

  it("draws the report's point size by default and bigger points when asked", () => {
    const small = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend }),
    );
    expect(small).toContain('r="4.2"');
    const big = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend, pointRadius: 8 }),
    );
    expect(big).toContain('r="8"');
    expect(big).not.toContain('r="4.2"');
  });

  it("can leave out the native tooltips", () => {
    const html = renderToStaticMarkup(
      createElement(PointsTrend, { matches: trend, nativeTooltips: false }),
    );
    expect(html).not.toContain("<title>");
    expect(html).toContain('data-point="0"');
  });

  it("renders nothing without matches", () => {
    expect(
      renderToStaticMarkup(createElement(PointsTrend, { matches: [] })),
    ).toBe("");
  });
});
