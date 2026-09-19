import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-status-actions.tsx"),
  "utf8",
);

describe("MatchStatusActions", () => {
  it("uses shared stacked actions so labels stay equal-width without spanning the screen", () => {
    expect(source).toContain("stackedActionsRowClassName");
    expect(source).toContain("stackedActionButtonClassName");
    expect(source).not.toContain("sm:w-auto");
  });
});
