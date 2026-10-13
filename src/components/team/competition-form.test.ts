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

function fieldWrapper(markup: string, id: string): string {
  const index = markup.indexOf(`htmlFor="${id}"`);
  const before = markup.slice(0, index);
  const open = before.lastIndexOf("<div");
  return before.slice(open, before.indexOf(">", open));
}

describe("CompetitionForm", () => {
  it("orders fields from name through notes", () => {
    expect(fieldIds(source)).toEqual([
      "name",
      "display_name",
      "organizer",
      "kind",
      "result",
      "season",
      "date",
      "meetup_time",
      "home_away",
      "age_group",
      "gender",
      "venue",
      "players_per_team",
      "periods",
      "minutes_per_period",
      "notes",
    ]);
  });

  it("does not expose a format field", () => {
    expect(source).not.toContain('htmlFor="format"');
    expect(source).not.toContain('name="format"');
  });

  it("stacks every field in one column", () => {
    expect(source).toContain(
      'className="grid w-full min-w-0 grid-cols-1 gap-4"',
    );
    expect(source).not.toContain("sm:grid-cols-2");
    expect(source).not.toContain("sm:grid-cols-3");
    expect(source).not.toContain("sm:col-span");

    for (const id of fieldIds(source)) {
      const wrapper = fieldWrapper(source, id);
      expect(wrapper).toContain("min-w-0");
      expect(wrapper).not.toContain("grid-cols");
      expect(wrapper).not.toContain("col-span");
    }
  });

  it("keeps date and meet-up inside the dialog width", () => {
    for (const id of ["date", "meetup_time"]) {
      expect(fieldWrapper(source, id)).toContain("overflow-hidden");
    }
  });

  it("shows tournament schedule fields only for a tournament", () => {
    const branch = source.indexOf('{kind === "tournament" ? (');
    const block = source.slice(branch, source.indexOf(") : null}", branch));

    expect(block).toContain('htmlFor="date"');
    expect(block).toContain('htmlFor="meetup_time"');
    expect(block).toContain('htmlFor="home_away"');
    expect(block).not.toContain('htmlFor="age_group"');
    expect(block).toContain(
      "New matches in this tournament start with this date, meet-up,",
    );
  });

  it("saves an open edit dialog without leaving the page", () => {
    expect(source).toContain(
      "updateCompetitionAction.bind(null, competition.id)",
    );
    expect(source).toContain("stayOnPage");
  });
});
