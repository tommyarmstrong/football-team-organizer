import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "competitions-section.tsx"),
  "utf8",
);

describe("CompetitionsSection", () => {
  it("opens add competition in an inline dialog", () => {
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).not.toContain('href="/competitions/new"');
  });
});
