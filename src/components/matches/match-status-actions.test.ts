import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-status-actions.tsx"),
  "utf8",
);

describe("MatchStatusActions layout", () => {
  it("uses the shared stacked action row so buttons stay equal and content-sized", () => {
    expect(source).toContain("stackedActionsClassName");
    expect(source).toContain("stackedActionButtonClassName");
    expect(source).not.toContain("sm:w-auto");
  });
});
