import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("team page copy", () => {
  it("drops the guardian assistant and player of the month descriptions", () => {
    expect(source).toContain('title="Guardian assistants"');
    expect(source).toContain('title="Player of the month"');
    expect(source).not.toContain(
      "Guardians who can add fixtures and record match-day squad",
    );
    expect(source).not.toContain(
      "Monthly awards for standout players this season.",
    );
  });
});
