import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("club page", () => {
  it("opens add team and edit club in dialogs", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("AddTeamDialog");
    expect(source).toContain("EditClubDialog");
    expect(source).not.toContain('href="/teams/new"');
    expect(source).not.toContain('href="/club/edit"');
  });
});
