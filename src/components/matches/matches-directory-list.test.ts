import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "matches-directory-list.tsx"),
  "utf8",
);

describe("MatchesDirectoryList", () => {
  it("renders each row with the shared summary card", () => {
    expect(source).toContain("MatchSummaryCard");
    expect(source).toContain("match={match}");
    expect(source).toContain("teamName={teamName}");
    expect(source).not.toContain("MatchHero");
    expect(source).not.toContain('size="compact"');
  });

  it("does not colour competition names with primary", () => {
    expect(source).not.toMatch(/text-primary/);
  });
});
