import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PERIOD_STARTS_METRIC_OPTIONS } from "@/lib/stats/count-view";
import { StatFilters } from "@/components/stats/stat-filters";

function render(props: Partial<Parameters<typeof StatFilters>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(StatFilters, {
      positions: ["ALL"],
      onPositionsChange: vi.fn(),
      ...props,
    }),
  );
}

describe("StatFilters", () => {
  it("offers every position filter", () => {
    const html = render();
    expect(html).toContain('aria-label="Position filters"');
    for (const label of ["ALL", "FWD", "WNG", "MID", "DEF", "GK"]) {
      expect(html).toContain(`>${label}</button>`);
    }
  });

  it("marks the selected positions as pressed", () => {
    const html = render({ positions: ["FWD", "GK"] });
    expect(html).toMatch(/aria-pressed="true"[^>]*>FWD</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>ALL</);
  });

  it("omits the view filter unless a metric is wired up", () => {
    const html = render();
    expect(html).not.toContain(">View<");
    expect(html).not.toContain(">Per game<");
  });

  it("shows the view filter with its own aria label", () => {
    const html = render({
      metric: "per_game",
      onMetricChange: vi.fn(),
      metricAriaLabel: "Goals metric",
    });
    expect(html).toContain(">View<");
    expect(html).toContain('aria-label="Goals metric"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Per game</);
    expect(html).toContain(">Total</button>");
    expect(html).toContain(">Per period</button>");
  });

  it("shows only the given view options", () => {
    const html = render({
      metric: "total",
      onMetricChange: vi.fn(),
      metricAriaLabel: "Period starts metric",
      metricOptions: PERIOD_STARTS_METRIC_OPTIONS,
    });
    expect(html).toMatch(/aria-pressed="true"[^>]*>Periods</);
    expect(html).toContain(">Periods per game</button>");
    expect(html).not.toContain(">Per period<");
    expect(html).not.toContain(">Total<");
    // View sits under Position.
    expect(html.indexOf(">Position<")).toBeLessThan(html.indexOf(">View<"));
  });

  it("omits the type filter unless it is wired up", () => {
    const html = render({
      metric: "total",
      onMetricChange: vi.fn(),
      metricAriaLabel: "Period starts metric",
    });
    expect(html).not.toContain(">Type<");
    expect(html).not.toContain(">Quarters<");
  });

  it("offers All, Quarters, Halves and Extra time with the selected type pressed", () => {
    const html = render({ periodType: "all", onPeriodTypeChange: vi.fn() });
    expect(html).toContain('aria-label="Period type filters"');
    for (const label of ["All", "Quarters", "Halves", "Extra time"]) {
      expect(html).toContain(`>${label}</button>`);
    }
    expect(html).toMatch(/aria-pressed="true"[^>]*>All</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Halves</);

    const halves = render({
      periodType: "halves",
      onPeriodTypeChange: vi.fn(),
    });
    expect(halves).toMatch(/aria-pressed="true"[^>]*>Halves</);
    expect(halves).toMatch(/aria-pressed="false"[^>]*>All</);
  });

  it("puts Type between Position and View", () => {
    const html = render({
      periodType: "all",
      onPeriodTypeChange: vi.fn(),
      metric: "total",
      onMetricChange: vi.fn(),
      metricAriaLabel: "Period starts metric",
      metricOptions: PERIOD_STARTS_METRIC_OPTIONS,
    });
    const position = html.indexOf(">Position<");
    const type = html.indexOf(">Type<");
    const view = html.indexOf(">View<");
    expect(position).toBeGreaterThan(-1);
    expect(type).toBeGreaterThan(position);
    expect(view).toBeGreaterThan(type);
  });
});
