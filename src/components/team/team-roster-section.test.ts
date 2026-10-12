import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const roster = readFileSync(
  path.join(import.meta.dirname, "team-roster-section.tsx"),
  "utf8",
);
const matchDay = readFileSync(
  path.join(import.meta.dirname, "..", "matches", "match-squad-section.tsx"),
  "utf8",
);
const squadSelection = readFileSync(
  path.join(import.meta.dirname, "..", "shared", "squad-selection-section.tsx"),
  "utf8",
);

describe("squad rows", () => {
  it("use kit number and name on the team roster and match-day squad", () => {
    expect(roster).toContain("SquadPlayerIdentity");
    expect(matchDay).toContain("SquadSelectionSection");
    expect(squadSelection).toContain("SquadPlayerIdentity");
    expect(roster).not.toContain("InitialsAvatar");
    expect(squadSelection).not.toContain("InitialsAvatar");
  });
});
