import { describe, expect, it } from "vitest";
import { MATCH_STATUSES } from "@/lib/constants";
import {
  canQuickSetStatus,
  matchActionPlan,
  quickStatusLabel,
} from "@/lib/matches/status-actions";

describe("matchActionPlan", () => {
  it("scheduled: Kick off, with Full time, Cancelled and Postponed in Options", () => {
    expect(matchActionPlan("scheduled")).toEqual({
      primary: "in_progress",
      menu: ["played", "cancelled", "postponed"],
    });
  });

  it("in progress: Full time, with Scheduled, Cancelled and Postponed in Options", () => {
    expect(matchActionPlan("in_progress")).toEqual({
      primary: "played",
      menu: ["scheduled", "cancelled", "postponed"],
    });
  });

  it("has no controls once played, cancelled or postponed", () => {
    expect(matchActionPlan("played")).toBeNull();
    expect(matchActionPlan("cancelled")).toBeNull();
    expect(matchActionPlan("postponed")).toBeNull();
  });
});

describe("canQuickSetStatus", () => {
  it("allows exactly the planned moves", () => {
    expect(canQuickSetStatus("scheduled", "in_progress")).toBe(true);
    expect(canQuickSetStatus("scheduled", "played")).toBe(true);
    expect(canQuickSetStatus("scheduled", "cancelled")).toBe(true);
    expect(canQuickSetStatus("scheduled", "postponed")).toBe(true);
    expect(canQuickSetStatus("in_progress", "played")).toBe(true);
    expect(canQuickSetStatus("in_progress", "scheduled")).toBe(true);
    expect(canQuickSetStatus("in_progress", "cancelled")).toBe(true);
    expect(canQuickSetStatus("in_progress", "postponed")).toBe(true);
  });

  it("rejects staying put, going backwards from played, and leaving final states", () => {
    expect(canQuickSetStatus("scheduled", "scheduled")).toBe(false);
    expect(canQuickSetStatus("in_progress", "in_progress")).toBe(false);
    for (const next of MATCH_STATUSES) {
      expect(canQuickSetStatus("played", next)).toBe(false);
      expect(canQuickSetStatus("cancelled", next)).toBe(false);
      expect(canQuickSetStatus("postponed", next)).toBe(false);
    }
  });
});

describe("quickStatusLabel", () => {
  it("labels moves the way the buttons read", () => {
    expect(quickStatusLabel("in_progress")).toBe("Kick off");
    expect(quickStatusLabel("played")).toBe("Full time");
    expect(quickStatusLabel("scheduled")).toBe("Scheduled");
    expect(quickStatusLabel("cancelled")).toBe("Cancelled");
    expect(quickStatusLabel("postponed")).toBe("Postponed");
  });
});
