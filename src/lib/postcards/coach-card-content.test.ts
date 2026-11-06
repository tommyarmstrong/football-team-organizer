import { describe, expect, it } from "vitest";
import {
  coachCardCaption,
  coachCardFileName,
  coachCardNames,
  coachCardStats,
  coachRoleLabel,
} from "@/lib/postcards/coach-card-content";

const result = (
  letter: "W" | "D" | "L",
  goalsFor: number,
  goalsAgainst: number,
  isFriendly = false,
) => ({ result: letter, goalsFor, goalsAgainst, isFriendly });

describe("coachRoleLabel", () => {
  it("uses the recorded role", () => {
    expect(coachRoleLabel("Head Coach")).toBe("Head Coach");
    expect(coachRoleLabel("  Assistant Coach ")).toBe("Assistant Coach");
  });

  it("falls back to Coach", () => {
    expect(coachRoleLabel(null)).toBe("Coach");
    expect(coachRoleLabel(undefined)).toBe("Coach");
    expect(coachRoleLabel("   ")).toBe("Coach");
  });
});

describe("coachCardStats", () => {
  it("totals the competitive record and goals", () => {
    expect(
      coachCardStats([
        result("W", 3, 1),
        result("W", 2, 0),
        result("D", 1, 1),
        result("L", 0, 4),
      ]),
    ).toEqual({
      played: 4,
      wins: 2,
      draws: 1,
      losses: 1,
      goalsFor: 6,
      goalsAgainst: 6,
    });
  });

  it("leaves friendlies out", () => {
    expect(
      coachCardStats([result("W", 3, 1), result("W", 9, 0, true)]),
    ).toEqual({
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 1,
    });
  });

  it("is all zeros with no results", () => {
    expect(coachCardStats([])).toEqual({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  });
});

describe("coachCardNames", () => {
  it("always includes the surname", () => {
    expect(
      coachCardNames({ first_name: " Grace ", last_name: "Hopper" }),
    ).toEqual({ firstName: "Grace", lastName: "Hopper" });
  });

  it("tolerates blank names", () => {
    expect(coachCardNames({ first_name: " ", last_name: " " })).toEqual({
      firstName: "Coach",
      lastName: null,
    });
  });
});

describe("coachCardCaption", () => {
  const base = {
    coach: { first_name: "Grace", last_name: "Hopper" },
    roleLabel: "Head Coach",
    clubName: "Mill Green",
    teamName: "U11 Girls",
    seasonLabel: "2025/26",
    stats: {
      played: 14,
      wins: 8,
      draws: 3,
      losses: 3,
      goalsFor: 31,
      goalsAgainst: 17,
    },
  };

  it("lists the name, role, team, and record", () => {
    expect(coachCardCaption(base)).toBe(
      [
        "Grace Hopper · Head Coach",
        "Mill Green · U11 Girls · 2025/26",
        "",
        "Competitive matches: 14 (W8 D3 L3)",
        "Goals for: 31",
        "Goals against: 17",
      ].join("\n"),
    );
  });

  it("skips blank club names", () => {
    const caption = coachCardCaption({ ...base, clubName: " " });
    expect(caption.split("\n")[1]).toBe("U11 Girls · 2025/26");
  });

  it("uses the first name alone when there is no surname", () => {
    const caption = coachCardCaption({
      ...base,
      coach: { first_name: "Grace", last_name: "" },
    });
    expect(caption.split("\n")[0]).toBe("Grace · Head Coach");
  });
});

describe("coachCardFileName", () => {
  it("slugs the name, team, and season", () => {
    expect(
      coachCardFileName({
        firstName: "Grace",
        lastName: "Hopper",
        teamName: "U11 Girls",
        seasonLabel: "2025/26",
      }),
    ).toBe("grace-hopper-u11-girls-2025-26-coach-card.png");
  });

  it("works without a surname", () => {
    expect(
      coachCardFileName({
        firstName: "Grace",
        lastName: null,
        teamName: "U11 Girls",
        seasonLabel: "2025/26",
      }),
    ).toBe("grace-u11-girls-2025-26-coach-card.png");
  });
});
