import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "matches-directory-list.tsx"),
  "utf8",
);

describe("MatchesDirectoryList", () => {
  it("renders the compact fixture row on every screen", () => {
    expect(source).toContain(
      "<MatchListRow match={match} teamName={teamName} />",
    );
    expect(source).not.toContain("MatchSummaryCard");
    expect(source).not.toContain("sm:hidden");
    expect(source).not.toContain("hidden sm:block");
    expect(source).not.toContain("MatchHero");
  });

  it("uses the continuous list container", () => {
    expect(source).toContain("listClassName={matchListContainerClassName}");
    expect(source).not.toContain('listClassName="space-y-3"');
  });

  it("uses the short search placeholder", () => {
    expect(source).toContain('filterPlaceholder="Search matches…"');
  });

  it("still searches by opponent, team, venue, competition and status", () => {
    expect(source).toContain("match.opponent_name");
    expect(source).toContain("match.venue?.name");
    expect(source).toContain("matchCompetitionLabel(match)");
    expect(source).toContain("labelMatchStatus(match.status)");
  });

  it("does not colour competition names with primary", () => {
    expect(source).not.toMatch(/text-primary/);
  });
});
