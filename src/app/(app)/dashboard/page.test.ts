import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pageBodyClassName } from "@/components/shared/page-body";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("dashboard layout", () => {
  it("keeps the phone column and pairs sections only from the large screen up", () => {
    expect(source).not.toContain("dashboard-title-card");
    expect(source).not.toContain("PitchGraphic");
    expect(source).not.toContain("club-chrome");
    expect(source).toContain('pageBodyClassName("space-y-8 lg:max-w-none")');
    const width = pageBodyClassName("space-y-8 lg:max-w-none");
    expect(width).toContain("max-w-lg");
    expect(width).toContain("lg:max-w-none");
    expect(source).toContain("lg:grid-cols-2");
    expect(source).not.toContain("sm:grid-cols-2");
    expect(source).not.toContain("<DashboardLeaderboards");
    expect(source).not.toContain("<DashboardForm");
    expect(source).not.toContain("<DashboardSeasonTiles");

    const overview = source.indexOf("<DashboardOverviewAndForm");
    const fixtures = source.indexOf("<DashboardFixtures");
    const competitions = source.indexOf("<DashboardCompetitions");
    const players = source.indexOf("<DashboardPlayers");
    expect(overview).toBeGreaterThan(-1);
    expect(fixtures).toBeGreaterThan(overview);
    expect(competitions).toBeGreaterThan(fixtures);
    expect(players).toBeGreaterThan(competitions);
  });
});
