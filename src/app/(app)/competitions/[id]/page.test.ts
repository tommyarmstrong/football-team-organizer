import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("competition detail page", () => {
  it("opens competition edit in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("EditCompetitionDialog");
    expect(source.match(/pageBodyClassName\(/g)).toHaveLength(2);
    expect(source).toContain('pageBodyClassName("space-y-4")');
    expect(source).toContain('pageBodyClassName("space-y-8")');
    expect(source).not.toContain(
      "href={`/competitions/${competition.id}/edit`}",
    );
    expect(source).not.toContain("labelCompetitionFormat");
  });

  it("shows a tournament squad editor only for tournaments", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("TournamentSquadSection");
    expect(source).toContain('competition.kind === "tournament"');
    expect(source).toContain('title="Tournament squad"');
  });
});
