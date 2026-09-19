import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("dashboard title", () => {
  it("uses a vibrant gradient card like the login Matchday-ready panel", () => {
    expect(source).toContain("dashboard-title-card");
    expect(source).toContain("dashboard-title-kicker");
    expect(source).toContain("dashboard-title-graphic");
    expect(source).toContain("shadow-lg");
    expect(source).toContain("rounded-full");
    expect(source).not.toContain("bg-hero");
  });
});
