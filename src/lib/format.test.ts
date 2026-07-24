import { describe, expect, it } from "vitest";
import {
  formatKickoffTime,
  formatMatchDate,
  formatScore,
  formatShortDate,
  labelCompetitionKind,
  labelGender,
  labelMatchStatus,
  labelVenue,
  playerDisplayName,
  resultLetter,
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
    expect(labelVenue("home")).toBe("Home");
    expect(labelMatchStatus("scheduled")).toBe("Scheduled");
    expect(labelCompetitionKind("league")).toBe("League");
  });

  it("returns an em dash for null competition kind", () => {
    expect(labelCompetitionKind(null)).toBe("—");
  });
});
