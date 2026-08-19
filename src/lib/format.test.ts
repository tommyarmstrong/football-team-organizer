import { describe, expect, it } from "vitest";
import {
  coachDisplayName,
  formatAge,
  formatAwardMonth,
  formatCountLabel,
  formatGoalMinute,
  formatHomeFirstScore,
  formatKickoffTime,
  formatMatchDate,
  formatMatchDateTime,
  formatMatchTitle,
  formatMatchVersusTitle,
  formatScore,
  formatShortDate,
  formatTeamHeaderSummary,
  formatTrainingDays,
  formatVenueAddress,
  formatVenueFoodAndDrink,
  formatVenueSurface,
  goalKindLabel,
  goalScorerLabel,
  guardianDisplayName,
  labelCardType,
  labelCoachObjectiveStatus,
  labelCoachObjectiveType,
  labelCompetitionGender,
  labelCompetitionKind,
  labelCompetitionPeriods,
  labelCompetitionResult,
  labelGender,
  labelHomeAway,
  labelMatchStatus,
  labelPlayerObjectiveStatus,
  labelPlayerObjectiveType,
  labelVenueFoodAndDrink,
  labelVenueSurface,
  managerDisplayName,
  matchSummaryLines,
  playerDisplayName,
  resultLetter,
  scoreFromGoals,
  teamDisplayName,
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

describe("formatAge", () => {
  it("formats completed years and months", () => {
    expect(formatAge("2015-03-15", new Date(2025, 7, 15))).toBe(
      "10 years, 5 months",
    );
  });

  it("rounds down when the birthday day has not arrived this month", () => {
    expect(formatAge("2015-03-20", new Date(2025, 7, 15))).toBe(
      "10 years, 4 months",
    );
  });

  it("handles month-only ages", () => {
    expect(formatAge("2025-01-10", new Date(2025, 7, 15))).toBe("7 months");
  });

  it("omits months when exactly N years", () => {
    expect(formatAge("2015-08-15", new Date(2025, 7, 15))).toBe("10 years");
  });

  it("borrows a year when the month offset is negative", () => {
    expect(formatAge("2015-10-15", new Date(2025, 7, 15))).toBe(
      "9 years, 10 months",
    );
  });

  it("uses singular year and month labels", () => {
    expect(formatAge("2024-08-15", new Date(2025, 7, 15))).toBe("1 year");
    expect(formatAge("2025-07-15", new Date(2025, 7, 15))).toBe("1 month");
  });

  it("clamps future dates of birth to zero months", () => {
    expect(formatAge("2026-01-01", new Date(2025, 7, 15))).toBe("0 months");
  });
});

describe("formatAwardMonth", () => {
  it("formats YYYY-MM as a long month and year", () => {
    expect(formatAwardMonth("2025-03")).toBe("March 2025");
  });

  it("returns the original string when the month is invalid", () => {
    expect(formatAwardMonth("2025")).toBe("2025");
    expect(formatAwardMonth("not-a-month")).toBe("not-a-month");
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

describe("formatMatchDateTime", () => {
  it("joins date and kickoff with a middle dot", () => {
    const date = formatMatchDate("2026-03-15");
    expect(formatMatchDateTime("2026-03-15", "14:30:00")).toBe(
      `${date} · 14:30`,
    );
  });

  it("returns only the date when kickoff is missing", () => {
    expect(formatMatchDateTime("2026-03-15", null)).toBe(
      formatMatchDate("2026-03-15"),
    );
  });
});

describe("matchSummaryLines", () => {
  it("returns competition, date/time, and venue as separate lines", () => {
    expect(
      matchSummaryLines({
        competitionName: "Premier League",
        date: "2026-03-15",
        kickoffTime: "10:00",
        venueName: "Wembley",
      }),
    ).toEqual({
      competition: "Premier League",
      dateTime: formatMatchDateTime("2026-03-15", "10:00"),
      venue: "Wembley",
    });
  });

  it("omits blank competition and venue so callers skip those lines", () => {
    expect(
      matchSummaryLines({
        competitionName: "  ",
        date: "2026-03-15",
        kickoffTime: null,
        venueName: null,
      }),
    ).toEqual({
      competition: null,
      dateTime: formatMatchDate("2026-03-15"),
      venue: null,
    });
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
    ).toBe("7 Alex Smith");
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
    ).toBe("Goal against");
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

describe("formatHomeFirstScore", () => {
  it("keeps our score first for home and neutral", () => {
    expect(formatHomeFirstScore(4, 2, "home")).toBe("4–2");
    expect(formatHomeFirstScore(4, 2, "neutral")).toBe("4–2");
    expect(formatHomeFirstScore(4, 2, null)).toBe("4–2");
  });

  it("puts the opposition (home) score first when we are away", () => {
    expect(formatHomeFirstScore(4, 2, "away")).toBe("2–4");
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
    expect(labelGender("girls")).toBe("Girls");
    expect(labelGender("men")).toBe("Men");
    expect(labelGender("women")).toBe("Women");
    expect(labelGender("mixed")).toBe("Mixed");
    expect(labelHomeAway("home")).toBe("Home");
    expect(labelMatchStatus("scheduled")).toBe("Scheduled");
    expect(labelMatchStatus("in_progress")).toBe("In progress");
    expect(labelCompetitionKind("league")).toBe("League");
  });

  it("returns an em dash for null competition kind", () => {
    expect(labelCompetitionKind(null)).toBe("—");
  });

  it("labels competition gender, periods, and result", () => {
    expect(labelCompetitionGender("female")).toBe("Female");
    expect(labelCompetitionGender(null)).toBe("—");
    expect(labelCompetitionPeriods("2")).toBe("2 (Halves)");
    expect(labelCompetitionPeriods("4")).toBe("4 (Quarters)");
    expect(labelCompetitionPeriods("other")).toBe("Other");
    expect(labelCompetitionPeriods(null)).toBe("—");
    expect(labelCompetitionResult("champions")).toBe("Champions");
    expect(labelCompetitionResult("runner_up")).toBe("Runner up");
    expect(labelCompetitionResult("completed")).toBe("Completed");
    expect(labelCompetitionResult("cancelled")).toBe("Cancelled");
    expect(labelCompetitionResult(null)).toBe("—");
    expect(labelCompetitionResult(undefined)).toBe("—");
  });

  it("labels venue, card, and objective enums", () => {
    expect(labelVenueSurface("astro")).toBe("Astro");
    expect(labelVenueSurface("hard_court")).toBe("Hard Court");
    expect(labelVenueFoodAndDrink("tuck_shop")).toBe("Tuck shop");
    expect(labelVenueFoodAndDrink("rain_shelter")).toBe("Rain shelter");
    expect(labelCardType("yellow_1st")).toBe("Yellow card (1st)");
    expect(labelCoachObjectiveType("time_management")).toBe("Time Management");
    expect(labelCoachObjectiveStatus("ready_for_review")).toBe(
      "Ready for Review",
    );
    expect(labelPlayerObjectiveType("team_work")).toBe("Team work");
    expect(labelPlayerObjectiveStatus("exceeding")).toBe("Exceeding");
  });
});

describe("formatVenueSurface", () => {
  it("returns null for empty input", () => {
    expect(formatVenueSurface(null)).toBeNull();
    expect(formatVenueSurface(undefined)).toBeNull();
    expect(formatVenueSurface([])).toBeNull();
  });

  it("formats a single value or joined list", () => {
    expect(formatVenueSurface("grass")).toBe("Grass");
    expect(formatVenueSurface(["astro", "hard_court"])).toBe(
      "Astro, Hard Court",
    );
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

describe("formatMatchTitle", () => {
  it("uses versus form when not played or in progress", () => {
    expect(
      formatMatchTitle("England", "West Germany", "home", "scheduled", 0, 0),
    ).toBe("England vs West Germany");
    expect(
      formatMatchTitle("England", "West Germany", "home", "cancelled", 0, 0),
    ).toBe("England vs West Germany");
    expect(
      formatMatchTitle("England", "West Germany", "away", "postponed", 0, 0),
    ).toBe("West Germany vs England");
  });

  it("embeds the home-first score when played or in progress", () => {
    expect(
      formatMatchTitle("England", "West Germany", "home", "played", 4, 2),
    ).toBe("England 4-2 West Germany");
    expect(
      formatMatchTitle("England", "West Germany", "away", "in_progress", 4, 2),
    ).toBe("West Germany 2-4 England");
    expect(
      formatMatchTitle("England", "West Germany", "neutral", "played", 1, 1),
    ).toBe("England 1-1 West Germany");
  });
});

describe("teamDisplayName", () => {
  it("prefers display_name when set", () => {
    expect(
      teamDisplayName({ name: "U11 Boys Blues", display_name: "Blues" }),
    ).toBe("Blues");
  });

  it("falls back to name", () => {
    expect(
      teamDisplayName({ name: "U11 Boys Blues", display_name: null }),
    ).toBe("U11 Boys Blues");
    expect(
      teamDisplayName({ name: "U11 Boys Blues", display_name: "  " }),
    ).toBe("U11 Boys Blues");
  });
});

describe("formatTeamHeaderSummary", () => {
  it("joins club, gender, age group, and season", () => {
    expect(
      formatTeamHeaderSummary({
        clubName: "Arsenal",
        gender: "boys",
        ageGroup: "U11",
        seasonLabel: "2025/26",
      }),
    ).toBe("Arsenal · Boys · U11 · 2025/26");
  });

  it("appends Archived for historic seasons", () => {
    expect(
      formatTeamHeaderSummary({
        clubName: "Arsenal",
        gender: "girls",
        ageGroup: "U10",
        seasonLabel: "2024/25",
        archived: true,
      }),
    ).toBe("Arsenal · Girls · U10 · 2024/25 · Archived");
  });
});

describe("formatTrainingDays", () => {
  it("returns an em dash when empty", () => {
    expect(formatTrainingDays(null)).toBe("—");
    expect(formatTrainingDays([])).toBe("—");
  });

  it("joins labelled weekdays", () => {
    expect(formatTrainingDays(["tue", "thu"])).toBe("Tue, Thu");
  });

  it("passes through unknown day codes", () => {
    expect(formatTrainingDays(["tue", "game-day"])).toBe("Tue, game-day");
  });
});

describe("formatCountLabel", () => {
  it("uses the singular noun for one", () => {
    expect(formatCountLabel(1, "goal", "goals")).toBe("1 goal");
  });

  it("uses the plural noun otherwise", () => {
    expect(formatCountLabel(0, "goal", "goals")).toBe("0 goals");
    expect(formatCountLabel(4, "assist", "assists")).toBe("4 assists");
  });
});
