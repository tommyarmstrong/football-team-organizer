import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "matches-directory-list.tsx"),
  "utf8",
);

describe("MatchesDirectoryList", () => {
  it("reuses MatchHero compact rows", () => {
    expect(source).toContain('size="compact"');
    expect(source).toContain("MatchHero");
    expect(source).toContain("meetupTime={match.meetup_time}");
    expect(source).toContain("kickoffTime={match.kickoff_time}");
    expect(source).toContain("venueName={match.venue?.name ?? null}");
  });

  it("does not colour competition names with primary", () => {
    expect(source).not.toMatch(/text-primary/);
  });
});
