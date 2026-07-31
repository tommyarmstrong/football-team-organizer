import { describe, expect, it } from "vitest";
import {
  clubIconSrc,
  isValidClubColour,
  parseClubColour,
} from "@/lib/clubs/branding";
import { DEFAULT_CLUB_ICON_SRC } from "@/lib/constants";

describe("parseClubColour", () => {
  it("returns null for empty input", () => {
    expect(parseClubColour("")).toBeNull();
    expect(parseClubColour("   ")).toBeNull();
  });

  it("accepts #RRGGBB and normalises case", () => {
    expect(parseClubColour("#1b4d3e")).toBe("#1B4D3E");
  });

  it("accepts RRGGBB without hash", () => {
    expect(parseClubColour("AABBCC")).toBe("#AABBCC");
  });

  it("rejects invalid values", () => {
    expect(parseClubColour("#xyz")).toEqual({
      error: "Club colour must be a hex value like #1B4D3E.",
    });
    expect(parseClubColour("#12345")).toEqual({
      error: "Club colour must be a hex value like #1B4D3E.",
    });
  });
});

describe("isValidClubColour", () => {
  it("validates hex colours", () => {
    expect(isValidClubColour("#00FF00")).toBe(true);
    expect(isValidClubColour("#00ff00")).toBe(true);
    expect(isValidClubColour("00FF00")).toBe(false);
  });
});

describe("clubIconSrc", () => {
  it("falls back to the default football icon", () => {
    expect(clubIconSrc(null)).toBe(DEFAULT_CLUB_ICON_SRC);
    expect(clubIconSrc("")).toBe(DEFAULT_CLUB_ICON_SRC);
    expect(clubIconSrc("  ")).toBe(DEFAULT_CLUB_ICON_SRC);
  });

  it("returns a provided icon URL", () => {
    expect(clubIconSrc("https://example.com/icon.png")).toBe(
      "https://example.com/icon.png",
    );
  });
});
