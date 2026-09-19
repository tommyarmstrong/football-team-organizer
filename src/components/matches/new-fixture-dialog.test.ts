import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("inline entity dialogs", () => {
  it("opens new fixture without navigating to /matches/new", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "new-fixture-dialog.tsx"),
      "utf8",
    );
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).toContain("create");
  });

  it("opens match edit without navigating to /matches/:id/edit", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "edit-match-dialog.tsx"),
      "utf8",
    );
    expect(source).toContain("InlineFormDialog");
    expect(source).toContain("stayOnPage");
    expect(source).toContain("edit");
    expect(source).toContain("EditIconButton");
  });
});
