import { describe, expect, it } from "vitest";
import {
  coachDisplayName,
  formatGoalMinute,
  formatKickoffTime,
  formatMatchDate,
  formatMatchVersusTitle,
  formatScore,
  formatShortDate,
  formatVenueAddress,
  formatVenueFoodAndDrink,
  goalKindLabel,
  goalScorerLabel,
  guardianDisplayName,
  labelCardType,
  labelCoachObjectiveStatus,
  labelCoachObjectiveType,
  labelCompetitionGender,
  labelCompetitionKind,
  labelCompetitionPeriods,
  labelGender,
  labelHomeAway,
  labelMatchStatus,
  labelPlayerObjectiveStatus,
  labelPlayerObjectiveType,
  labelVenueFoodAndDrink,
  labelVenueSurface,
  managerDisplayName,
  playerDisplayName,
  resultLetter,
  scoreFromGoals,
} from "@/lib/format";

describe("formatMatchDate", () => {
  it("formats a YYYY-MM-DD date in en-GB style", () => {
    expect(formatMatchDate("2026-03-15")).toMatch(/15/);
    expect(formatMatchDate("2026-03-15")).toMatch(/Mar/);
    expect(formatMatchDate("2026-03-15")).toMatch(/2026/);
  });
});

describe("formatShortDate", () => {
  it("formats without weekday", () => {
    const formatted = formatShortDate("2026-07-24");
    expect(formatted).toMatch(/24/);
    expect(formatted).toMatch(/Jul/);
    expect(formatted).not.toMatch(/Fri|Mon|Tue|Wed|Thu|Sat|Sun/);
  });
});

describe("formatKickoffTime", () => {
  it("returns null for empty time", () => {
    expect(formatKickoffTime(null)).toBeNull();
  });

  it("truncates seconds to HH:MM", () => {
    expect(formatKickoffTime("14:30:00")).toBe("14:30");
    expect(formatKickoffTime("09:05")).toBe("09:05");
  });
});

describe("playerDisplayName", () => {
  it("joins first and last name", () => {
    expect(playerDisplayName({ first_name: "Alex", last_name: "Smith" })).toBe(
      "Alex Smith",
    );
  });

  it("prefixes shirt number when provided", () => {
    expect(
      playerDisplayName(
        { first_name: "Alex", last_name: "Smith" },
        { shirtNumber: 7 },
      ),
    ).toBe("#7 Alex Smith");
  });

  it("omits shirt prefix when shirtNumber is null", () => {
    expect(
      playerDisplayName(
        { first_name: "Alex", last_name: "Smith" },
        { shirtNumber: null },
      ),
    ).toBe("Alex Smith");
  });
});

describe("coachDisplayName", () => {
  it("joins first and second name", () => {
    expect(coachDisplayName({ first_name: "Alex", second_name: "Coach" })).toBe(
      "Alex Coach",
    );
  });
});

describe("guardianDisplayName / managerDisplayName", () => {
  it("joins first and second name", () => {
    expect(
      guardianDisplayName({ first_name: "Pat", second_name: "Guardian" }),
    ).toBe("Pat Guardian");
    expect(
      managerDisplayName({ first_name: "Sam", second_name: "Manager" }),
    ).toBe("Sam Manager");
  });
});

describe("goalScorerLabel", () => {
  it("labels own goals and opposition goals", () => {
    expect(
      goalScorerLabel({
        is_opposition: false,
        is_own_goal: true,
        scorer: null,
      }),
    ).toBe("Own Goal");
    expect(
      goalScorerLabel({
        is_opposition: true,
        is_own_goal: false,
        scorer: null,
      }),
    ).toBe("Opponent Goal");
    expect(
      goalScorerLabel({
        is_opposition: false,
        is_own_goal: false,
        scorer: { first_name: "Alex", last_name: "Smith" },
      }),
    ).toBe("Alex Smith");
  });
});

describe("goalKindLabel", () => {
  it("returns a single bracketed kind or null", () => {
    expect(
      goalKindLabel({
        is_penalty: true,
        is_freekick: false,
        from_setpiece: false,
      }),
    ).toBe("(Penalty)");
    expect(
      goalKindLabel({
        is_penalty: false,
        is_freekick: true,
        from_setpiece: false,
      }),
    ).toBe("(Direct Free Kick)");
    expect(
      goalKindLabel({
        is_penalty: false,
        is_freekick: false,
        from_setpiece: true,
      }),
    ).toBe("(Set Piece)");
    expect(
      goalKindLabel({
        is_penalty: false,
        is_freekick: false,
        from_setpiece: false,
      }),
    ).toBeNull();
  });
});

describe("formatGoalMinute", () => {
  it("prefixes the minute with an apostrophe", () => {
    expect(formatGoalMinute(12)).toBe("'12");
    expect(formatGoalMinute(null)).toBeNull();
  });
});

describe("scoreFromGoals", () => {
  it("counts our goals and opposition goals separately", () => {
    expect(
      scoreFromGoals([
        { is_opposition: false },
        { is_opposition: false },
        { is_opposition: true },
      ]),
    ).toEqual({ goalsFor: 2, goalsAgainst: 1 });
  });

  it("returns zeros when there are no goals", () => {
    expect(scoreFromGoals([])).toEqual({ goalsFor: 0, goalsAgainst: 0 });
  });
});

describe("formatScore", () => {
  it("returns an em dash when either side is missing", () => {
    expect(formatScore(null, 1)).toBe("—");
    expect(formatScore(2, null)).toBe("—");
    expect(formatScore(null, null)).toBe("—");
  });

  it("formats both sides with an en dash", () => {
    expect(formatScore(3, 1)).toBe("3–1");
    expect(formatScore(0, 0)).toBe("0–0");
  });
});

describe("resultLetter", () => {
  it("returns null when score is incomplete", () => {
    expect(resultLetter(null, 0)).toBeNull();
    expect(resultLetter(1, null)).toBeNull();
  });

  it("returns W, D, or L from the scoreline", () => {
    expect(resultLetter(2, 1)).toBe("W");
    expect(resultLetter(1, 1)).toBe("D");
    expect(resultLetter(0, 3)).toBe("L");
  });
});

describe("label helpers", () => {
  it("capitalizes enum-like values", () => {
    expect(labelGender("boys")).toBe("Boys");
    expect(labelHomeAway("home")).toBe("Home");
    expect(labelMatchStatus("scheduled")).toBe("Scheduled");
    expect(labelMatchStatus("in_progress")).toBe("In progress");
    expect(labelCompetitionKind("league")).toBe("League");
  });

  it("returns an em dash for null competition kind", () => {
    expect(labelCompetitionKind(null)).toBe("—");
  });

  it("labels competition gender and periods", () => {
    expect(labelCompetitionGender("female")).toBe("Female");
    expect(labelCompetitionGender(null)).toBe("—");
    expect(labelCompetitionPeriods("2")).toBe("2 (Halves)");
    expect(labelCompetitionPeriods("other")).toBe("Other");
    expect(labelCompetitionPeriods(null)).toBe("—");
  });

  it("labels venue, card, and objective enums", () => {
    expect(labelVenueSurface("astro")).toBe("Astro");
    expect(labelVenueFoodAndDrink("tuck_shop")).toBe("Tuck shop");
    expect(labelCardType("yellow_1st")).toBe("Yellow card (1st)");
    expect(labelCoachObjectiveType("time_management")).toBe("Time Management");
    expect(labelCoachObjectiveStatus("ready_for_review")).toBe(
      "Ready for Review",
    );
    expect(labelPlayerObjectiveType("team_work")).toBe("Team work");
    expect(labelPlayerObjectiveStatus("exceeding")).toBe("Exceeding");
  });
});

describe("formatVenueFoodAndDrink", () => {
  it("returns null for empty input", () => {
    expect(formatVenueFoodAndDrink(null)).toBeNull();
    expect(formatVenueFoodAndDrink(undefined)).toBeNull();
    expect(formatVenueFoodAndDrink([])).toBeNull();
  });

  it("formats a single value or joined list", () => {
    expect(formatVenueFoodAndDrink("cafe")).toBe("Cafe");
    expect(formatVenueFoodAndDrink(["bbq", "ice_cream_van"])).toBe(
      "BBQ, Ice cream van",
    );
  });
});

describe("formatVenueAddress", () => {
  it("joins non-empty address parts", () => {
    expect(
      formatVenueAddress({
        address_line1: "1 Windmill Road",
        address_line2: "Edmonton",
        town_city: "London",
        postcode: "N18 1NB",
      }),
    ).toBe("1 Windmill Road, Edmonton, London, N18 1NB");
  });

  it("skips blank parts and returns null when empty", () => {
    expect(
      formatVenueAddress({
        address_line1: "  ",
        address_line2: null,
        town_city: "London",
        postcode: "",
      }),
    ).toBe("London");
    expect(
      formatVenueAddress({
        address_line1: null,
        address_line2: null,
        town_city: null,
        postcode: null,
      }),
    ).toBeNull();
  });
});

describe("formatMatchVersusTitle", () => {
  it("puts our team first for home, neutral, and unknown", () => {
    expect(formatMatchVersusTitle("U12 Blues", "Rivals FC", "home")).toBe(
      "U12 Blues vs Rivals FC",
    );
    expect(formatMatchVersusTitle("U12 Blues", "Rivals FC", "neutral")).toBe(
      "U12 Blues vs Rivals FC",
    );
    expect(formatMatchVersusTitle("U12 Blues", "Rivals FC", null)).toBe(
      "U12 Blues vs Rivals FC",
    );
  });

  it("puts opposition first for away", () => {
    expect(formatMatchVersusTitle("U12 Blues", "Rivals FC", "away")).toBe(
      "Rivals FC vs U12 Blues",
    );
  });
});
