import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "competition-form.tsx"),
  "utf8",
);

function fieldIds(markup: string): string[] {
  return [...markup.matchAll(/htmlFor="([^"]+)"/g)].map((match) => match[1]);
}

describe("CompetitionForm", () => {
  it("leads with name, display name, organizer, and kind", () => {
    expect(fieldIds(source).slice(0, 4)).toEqual([
      "name",
      "display_name",
      "organizer",
      "kind",
    ]);
  });

  it("does not expose a format field", () => {
    expect(source).not.toContain('htmlFor="format"');
    expect(source).not.toContain('name="format"');
  });

  it("saves an open edit dialog without leaving the page", () => {
    expect(source).toContain(
      "updateCompetitionAction.bind(null, competition.id)",
    );
    expect(source).toContain("stayOnPage");
  });
});
