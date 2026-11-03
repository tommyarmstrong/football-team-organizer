import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
});
