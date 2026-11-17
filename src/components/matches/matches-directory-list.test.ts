import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "matches-directory-list.tsx"),
  "utf8",
);

describe("MatchesDirectoryList", () => {
  it("renders the compact row on phones and the shared summary card from sm up", () => {
    expect(source).toContain("MatchListRow");
    expect(source).toContain("MatchSummaryCard");
    expect(source).toContain('className="sm:hidden"');
    expect(source).toContain('className="hidden sm:block"');
    expect(source).toContain("match={match}");
    expect(source).toContain("teamName={teamName}");
    expect(source).not.toContain("MatchHero");
    expect(source).not.toContain('size="compact"');
  });

  it("keeps the desktop card path unchanged", () => {
    const desktop = source.slice(source.indexOf('className="hidden sm:block"'));
    expect(desktop).toContain(
      "<MatchSummaryCard match={match} teamName={teamName} />",
    );
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
