import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "squad-player-identity.tsx"),
  "utf8",
);

describe("SquadPlayerIdentity", () => {
  it("shows club-colour initials, then a kit badge, then the full name", () => {
    expect(source).toContain("InitialsAvatar");
    expect(source).toContain("font-display");
    expect(source).toContain("bg-primary/10");
    expect(source).toContain('shirtNumber ?? "—"');
    expect(source).toContain("truncate font-medium");
    expect(source).not.toContain("w-[2ch]");
  });
});
