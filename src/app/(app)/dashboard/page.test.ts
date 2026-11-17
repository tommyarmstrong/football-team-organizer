import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("dashboard layout", () => {
  it("drops the pitch banner and puts form between the season summary and the fixtures", () => {
    expect(source).not.toContain("dashboard-title-card");
    expect(source).not.toContain("PitchGraphic");
    expect(source).not.toContain("club-chrome");
    const season = source.indexOf("<DashboardSeasonTiles");
    const form = source.indexOf("<DashboardForm");
    const fixtures = source.indexOf("<DashboardFixtures");
    const competitions = source.indexOf("<DashboardCompetitions");
    const leaderboards = source.indexOf("<DashboardLeaderboards");
    expect(season).toBeGreaterThan(-1);
    expect(form).toBeGreaterThan(season);
    expect(fixtures).toBeGreaterThan(form);
    expect(competitions).toBeGreaterThan(fixtures);
    expect(leaderboards).toBeGreaterThan(competitions);
  });
});
