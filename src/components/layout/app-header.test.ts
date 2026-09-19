import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "app-header.tsx"),
  "utf8",
);

describe("app header chrome", () => {
  it("uses the shared vibrant chrome fill instead of a solid header block", () => {
    expect(source).toContain("club-chrome");
    expect(source).toContain("club-themed-header");
    expect(source).toContain("club-themed-footer");
    expect(source).not.toMatch(/\bbg-header[\s"']/);
  });
});
