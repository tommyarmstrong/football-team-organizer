import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("dashboard title", () => {
  it("uses a wash class instead of a solid bg-hero fill", () => {
    expect(source).toContain("dashboard-title-card");
    expect(source).toContain("dashboard-title-kicker");
    expect(source).toContain("dashboard-title-graphic");
    expect(source).not.toContain("bg-hero");
    expect(source).not.toContain("text-pitch-lime");
  });
});
