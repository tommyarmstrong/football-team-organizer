import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "player-of-the-month-section.tsx"),
  "utf8",
);

describe("PlayerOfTheMonthSection", () => {
  it("opens add and edit in a stay-on-page dialog", () => {
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).toContain("PlayerOfTheMonthForm");
    expect(source).not.toContain('href="/player-of-the-month/new"');
  });
});
