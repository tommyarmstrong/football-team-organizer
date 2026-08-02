import { describe, expect, it } from "vitest";
import {
  isMatchPeriodName,
  matchAllowsEvents,
  matchPeriodSortOrder,
} from "@/lib/constants";

describe("isMatchPeriodName", () => {
  it("accepts known period names", () => {
    expect(isMatchPeriodName("First half")).toBe(true);
    expect(isMatchPeriodName("Penalty Shootout")).toBe(true);
  });

  it("rejects unknown names", () => {
    expect(isMatchPeriodName("Half 3")).toBe(false);
    expect(isMatchPeriodName("")).toBe(false);
  });
});

describe("matchPeriodSortOrder", () => {
  it("returns the configured rank for known periods", () => {
    expect(matchPeriodSortOrder("Quarter 1")).toBe(10);
    expect(matchPeriodSortOrder("Second half")).toBe(60);
    expect(matchPeriodSortOrder("Penalty Shootout")).toBe(100);
  });

  it("sorts unknown custom names after known periods", () => {
    expect(matchPeriodSortOrder("Custom period")).toBe(999);
  });
});

describe("matchAllowsEvents", () => {
  it("allows events for played and in-progress matches", () => {
    expect(matchAllowsEvents("played")).toBe(true);
    expect(matchAllowsEvents("in_progress")).toBe(true);
  });

  it("disallows events for other statuses", () => {
    expect(matchAllowsEvents("scheduled")).toBe(false);
    expect(matchAllowsEvents("postponed")).toBe(false);
    expect(matchAllowsEvents("cancelled")).toBe(false);
  });
});
