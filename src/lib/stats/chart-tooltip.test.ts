import { describe, expect, it } from "vitest";
import {
  clampTooltipCentre,
  nextTooltipIndex,
} from "@/lib/stats/chart-tooltip";

describe("nextTooltipIndex", () => {
  it("opens the tooltip for a tapped point", () => {
    expect(nextTooltipIndex(null, 3)).toBe(3);
  });

  it("moves to another point when it is tapped", () => {
    expect(nextTooltipIndex(3, 5)).toBe(5);
  });

  it("closes when the open point is tapped again", () => {
    expect(nextTooltipIndex(3, 3)).toBeNull();
  });

  it("closes when something else is tapped", () => {
    expect(nextTooltipIndex(3, null)).toBeNull();
    expect(nextTooltipIndex(null, null)).toBeNull();
  });

  it("treats the first point (index 0) as a real point", () => {
    expect(nextTooltipIndex(null, 0)).toBe(0);
    expect(nextTooltipIndex(0, 0)).toBeNull();
  });
});

describe("clampTooltipCentre", () => {
  it("keeps the tooltip over the point when there is room", () => {
    expect(clampTooltipCentre(200, 400, 120)).toBe(200);
  });

  it("stops the tooltip running off the left edge", () => {
    expect(clampTooltipCentre(10, 400, 120)).toBe(60);
  });

  it("stops the tooltip running off the right edge", () => {
    expect(clampTooltipCentre(395, 400, 120)).toBe(340);
  });

  it("centres the tooltip when the chart is narrower than it", () => {
    expect(clampTooltipCentre(10, 100, 120)).toBe(50);
  });
});
