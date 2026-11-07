import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ChartTheme,
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

  it("renders nothing without matches", () => {
    expect(
      renderToStaticMarkup(createElement(PointsTrend, { matches: [] })),
    ).toBe("");
  });
});
