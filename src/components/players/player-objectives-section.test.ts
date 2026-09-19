import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const player = readFileSync(
  path.join(import.meta.dirname, "player-objectives-section.tsx"),
  "utf8",
);
const coach = readFileSync(
  path.join(
    import.meta.dirname,
    "..",
    "coaches",
    "coach-objectives-section.tsx",
  ),
  "utf8",
);

describe("objective sections", () => {
  it("open add and edit in stay-on-page dialogs", () => {
    expect(player).toContain("InlineFormDialog");
    expect(player).toContain("stayOnPage");
    expect(player).toContain("PlayerObjectiveForm");
    expect(coach).toContain("InlineFormDialog");
    expect(coach).toContain("stayOnPage");
    expect(coach).toContain("CoachObjectiveForm");
  });
});
