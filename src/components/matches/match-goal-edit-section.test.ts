import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-goal-edit-section.tsx"),
  "utf8",
);

describe("MatchGoalEditSection", () => {
  it("saves edits on the match page without redirecting", () => {
    expect(source).toContain("saveGoalOnMatchAction");
    expect(source).toContain("stayOnPage");
  });
});
