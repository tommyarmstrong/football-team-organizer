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
    expect(source).not.toContain(
      "href={`/competitions/${competition.id}/edit`}",
    );
    expect(source).not.toContain("labelCompetitionFormat");
  });
});
