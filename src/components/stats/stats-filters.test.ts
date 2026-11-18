import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ALL_COMPETITIONS,
  ALL_LEAGUE_AND_CUP,
  FRIENDLY_KIND,
} from "@/lib/stats/competition-filters";
import { defaultStatsFilters } from "@/lib/stats/stats-page-filters";
import {
  StatsFilterChips,
  StatsFilterFields,
} from "@/components/stats/stats-filters";

const competitions = [
  { id: "league", name: "Sunday League", kind: "league" as const },
];

describe("StatsFilterFields", () => {
  it("offers competition, competition type and position", () => {
    const html = renderToStaticMarkup(
      createElement(StatsFilterFields, {
        idPrefix: "stats",
        competitions,
        value: defaultStatsFilters(),
        onChange: vi.fn(),
      }),
    );

    expect(html).toContain(">Competition<");
    expect(html).toContain(">All matches<");
    expect(html).toContain(">Sunday League<");
    expect(html).toContain(">Unknown competitions<");
    expect(html).toContain(">Competition type<");
    expect(html).toContain(">All types<");
    expect(html).toContain(">League and Cup<");
    expect(html).toContain(">Friendlies<");
    expect(html).toContain(">Position<");
    for (const label of ["All", "FWD", "WNG", "MID", "DEF", "GK"]) {
      expect(html).toContain(`>${label}</button>`);
    }
    expect(html).toMatch(/aria-pressed="true"[^>]*>League and Cup</);
    expect(html).toMatch(/aria-pressed="true"[^>]*>All</);
  });

  it("marks a chosen competition type and position", () => {
    const html = renderToStaticMarkup(
      createElement(StatsFilterFields, {
        idPrefix: "stats",
        competitions,
        value: {
          competitionId: ALL_COMPETITIONS,
          competitionKind: FRIENDLY_KIND,
          positions: ["DEF"],
        },
        onChange: vi.fn(),
      }),
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>Friendlies</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>League and Cup</);
    expect(html).toMatch(/aria-pressed="true"[^>]*>DEF</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>All</);
  });
});

describe("StatsFilterChips", () => {
  it("renders nothing at the defaults", () => {
    const html = renderToStaticMarkup(
      createElement(StatsFilterChips, {
        competitions,
        value: defaultStatsFilters(),
        onChange: vi.fn(),
      }),
    );
    expect(html).toBe("");
  });

  it("renders a removable chip for each active filter", () => {
    const html = renderToStaticMarkup(
      createElement(StatsFilterChips, {
        competitions,
        value: {
          competitionId: "league",
          competitionKind: ALL_LEAGUE_AND_CUP,
          positions: ["FWD"],
        },
        onChange: vi.fn(),
      }),
    );
    expect(html).toContain('aria-label="Active filters"');
    expect(html).toContain('aria-label="Remove Sunday League filter"');
    expect(html).toContain('aria-label="Remove FWD filter"');
    expect(html).not.toContain("Remove League and Cup");
  });
});
