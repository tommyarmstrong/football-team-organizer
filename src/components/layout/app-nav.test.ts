import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "app-nav.tsx"),
  "utf8",
);

describe("app nav chrome", () => {
  it("paints the mobile tab bar and more sheet with the shared vibrant chrome", () => {
    expect(source).toContain("club-chrome");
    expect(source).toContain("club-themed-footer");
    expect(source).not.toMatch(/\bbg-header[\s"']/);
  });
});
