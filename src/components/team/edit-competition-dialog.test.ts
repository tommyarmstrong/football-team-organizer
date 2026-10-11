import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("EditCompetitionDialog", () => {
  it("opens competition edit in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "edit-competition-dialog.tsx"),
      "utf8",
    );
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("EditIconButton");
    expect(source).toContain('mode="edit"');
    expect(source).toContain("stayOnPage");
  });
});
