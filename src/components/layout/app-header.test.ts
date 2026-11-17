import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "app-header.tsx"),
  "utf8",
);
const collapsing = readFileSync(
  path.join(import.meta.dirname, "collapsing-header.tsx"),
  "utf8",
);

describe("app header chrome", () => {
  it("uses the shared vibrant chrome fill instead of a solid header block", () => {
    // The footer lives in app-header; the header classes in collapsing-header.
    expect(source).toContain("club-themed-footer");
    expect(collapsing).toContain("club-chrome");
    expect(collapsing).toContain("club-themed-header");
    expect(source).not.toMatch(/\bbg-header[\s"']/);
    expect(collapsing).not.toMatch(/\bbg-header[\s"']/);
  });
});

describe("collapsing phone header", () => {
  it("keeps the desktop header sticky and limits fixed/collapse styles to phones", () => {
    expect(collapsing).toContain("md:sticky md:top-0");
    expect(collapsing).toContain("max-md:fixed");
    // Every collapse-related style is scoped to max-md so desktop is unchanged.
    const collapseTokens = collapsing
      .split(/\s+/)
      .map((token) => token.replace(/^["'`]/, ""))
      .filter((token) => token.includes("data-[collapsed=true]"));
    expect(collapseTokens.length).toBeGreaterThan(0);
    for (const token of collapseTokens) {
      expect(token.startsWith("max-md:")).toBe(true);
    }
  });

  it("reserves the expanded height in flow so collapsing never reflows the page", () => {
    expect(collapsing).toContain("4.75rem");
    expect(collapsing).toContain("md:hidden");
    expect(source).toContain("mobileHeaderSpacerClassName");
  });

  it("handles the iOS top safe area and respects reduced motion", () => {
    expect(collapsing).toContain("env(safe-area-inset-top)");
    expect(collapsing).toContain("motion-reduce:transition-none");
    expect(collapsing).toContain("duration-200 motion-reduce:transition-none");
  });

  it("does not re-render React on scroll (state lives in a data attribute)", () => {
    expect(collapsing).not.toContain("useState");
    expect(collapsing).toContain("bindHeaderCollapse");
    expect(collapsing).toContain('data-collapsed="false"');
  });

  it("keeps the team selector and a team label in both states", () => {
    expect(source).toContain("<TeamSwitcher");
    // The team label sits outside the row that folds away.
    const brandRow = source.indexOf("brandNameRowClassName}");
    const switcher = source.indexOf("<TeamSwitcher");
    expect(brandRow).toBeGreaterThan(-1);
    expect(switcher).toBeGreaterThan(brandRow);
    expect(source).toContain("teamSwitcherLabel(activeTeamOption)");
    expect(source).toContain("teams.length < 2");
  });

  it("leaves the bottom tab bar untouched", () => {
    expect(source).toContain("<MobileTabBar");
    expect(source).toContain(
      "fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden",
    );
  });
});
