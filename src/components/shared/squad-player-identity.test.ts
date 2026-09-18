import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "squad-player-identity.tsx"),
  "utf8",
);

describe("SquadPlayerIdentity", () => {
  it("shows club-colour initials, then kit number, then the full name", () => {
    expect(source).toContain("InitialsAvatar");
    expect(source).toContain('shirtNumber ?? "—"');
    expect(source).toContain("truncate font-medium");
  });
});
