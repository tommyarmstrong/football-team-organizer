import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "match-status-actions.tsx"),
  "utf8",
);

describe("MatchStatusActions", () => {
  it("uses the shared action bar: one 44px row on phones, equal-width buttons", () => {
    expect(source).toContain("actionBarClassName");
    expect(source).toContain("actionBarButtonClassName");
    expect(source).not.toContain("sm:w-auto");
  });

  it("keeps Kick off primary, Full time, and the Cancelled confirmation", () => {
    expect(source).toContain("Kick off");
    expect(source).toContain("Full time");
    expect(source).toContain("Cancel this match?");
    expect(source).toContain('aria-haspopup="dialog"');
  });
});
