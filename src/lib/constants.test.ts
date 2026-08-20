import { describe, expect, it } from "vitest";
import {
  availableExtraTimeOrPenaltyPeriodNames,
  isCompetitionPeriods,
  isExtraTimeOrPenaltyPeriodName,
  isMatchPeriodName,
  matchAllowsEvents,
  matchPeriodSortOrder,
  periodNamesForCompetitionPeriods,
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

describe("isCompetitionPeriods", () => {
  it("accepts competition period values", () => {
    expect(isCompetitionPeriods("1")).toBe(true);
    expect(isCompetitionPeriods("4")).toBe(true);
    expect(isCompetitionPeriods("other")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isCompetitionPeriods("3")).toBe(false);
    expect(isCompetitionPeriods("")).toBe(false);
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

describe("periodNamesForCompetitionPeriods", () => {
  it("maps competition period counts to named match periods", () => {
    expect(periodNamesForCompetitionPeriods("1")).toEqual([
      "Single period match",
    ]);
    expect(periodNamesForCompetitionPeriods("2")).toEqual([
      "First half",
      "Second half",
    ]);
    expect(periodNamesForCompetitionPeriods("4")).toEqual([
      "Quarter 1",
      "Quarter 2",
      "Quarter 3",
      "Quarter 4",
    ]);
    expect(periodNamesForCompetitionPeriods("other")).toEqual([]);
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

describe("availableExtraTimeOrPenaltyPeriodNames", () => {
  it("returns extra time and penalty names that are not already used", () => {
    expect(availableExtraTimeOrPenaltyPeriodNames(["First half"])).toEqual([
      "Extra time 1",
      "Extra time 2",
      "Penalty Shootout",
    ]);
    expect(
      availableExtraTimeOrPenaltyPeriodNames(["Extra time 1", "Quarter 1"]),
    ).toEqual(["Extra time 2", "Penalty Shootout"]);
    expect(
      availableExtraTimeOrPenaltyPeriodNames([
        "Extra time 1",
        "Extra time 2",
        "Penalty Shootout",
      ]),
    ).toEqual([]);
  });
});

describe("isExtraTimeOrPenaltyPeriodName", () => {
  it("accepts extra time and penalty labels only", () => {
    expect(isExtraTimeOrPenaltyPeriodName("Extra time 1")).toBe(true);
    expect(isExtraTimeOrPenaltyPeriodName("Penalty Shootout")).toBe(true);
    expect(isExtraTimeOrPenaltyPeriodName("First half")).toBe(false);
    expect(isExtraTimeOrPenaltyPeriodName("Quarter 3")).toBe(false);
  });
});
