import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AWARD_TONE_CLASS,
  AwardBadge,
  awardToneForRank,
} from "@/components/shared/award-badge";

describe("awardToneForRank", () => {
  it("maps 1st, 2nd, and 3rd to gold, silver, and bronze and everything else to black", () => {
    expect([1, 2, 3, 4, 5, 10].map(awardToneForRank)).toEqual([
      "gold",
      "silver",
      "bronze",
      "black",
      "black",
      "black",
    ]);
  });
});

describe("AwardBadge", () => {
  it("paints the ribbon in a fixed colour that ignores the club theme", () => {
    const html = renderToStaticMarkup(
      createElement(AwardBadge, { tone: "gold" }),
    );

    expect(html).toContain("lucide-award");
    expect(html).toContain(AWARD_TONE_CLASS.gold);
    expect(html).not.toContain("text-primary");
    expect(html).not.toContain("bg-primary");
  });
});
