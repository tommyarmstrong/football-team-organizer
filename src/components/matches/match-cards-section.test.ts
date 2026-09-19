import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-cards-section.tsx"),
  "utf8",
);

describe("MatchCardsSection", () => {
  it("opens add and edit card in a stay-on-page dialog", () => {
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).toContain("MatchCardEditSection");
    expect(source).not.toContain("`/matches/${matchId}/cards/new`");
  });
});
