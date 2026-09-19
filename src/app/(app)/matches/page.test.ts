import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("inline entity create/edit entry points", () => {
  it("opens matches new fixture in a dialog", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("NewFixtureDialog");
    expect(source).not.toContain('href="/matches/new"');
  });

  it("keeps the fixture list and new-fixture control in a left-aligned desktop column", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "page.tsx"),
      "utf8",
    );
    expect(source).toContain("max-w-lg");
    expect(source).not.toContain("mx-auto");
  });
});
