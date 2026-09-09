import { describe, expect, it } from "vitest";
import {
  buildClubColourHintCookie,
  clearClubColourHintCookie,
  CLUB_COLOUR_HINT_COOKIE,
  parseClubColourHint,
} from "@/lib/clubs/colour-hint";

describe("club colour hint", () => {
  it("accepts valid hex colours and normalises case", () => {
    expect(parseClubColourHint("#1b4d3e")).toBe("#1B4D3E");
  });

  it("rejects invalid colour values", () => {
    expect(parseClubColourHint("green")).toBeNull();
    expect(parseClubColourHint("#fff")).toBeNull();
    expect(parseClubColourHint("")).toBeNull();
  });

  it("builds a cookie that persists the hint", () => {
    expect(buildClubColourHintCookie("#1B4D3E")).toBe(
      `${CLUB_COLOUR_HINT_COOKIE}=#1B4D3E; Path=/; Max-Age=2592000; SameSite=Lax`,
    );
  });

  it("builds a cookie that clears the hint", () => {
    expect(clearClubColourHintCookie()).toBe(
      `${CLUB_COLOUR_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    );
  });
});
