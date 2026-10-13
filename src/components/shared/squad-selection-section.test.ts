import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sameSquadSelection } from "@/components/shared/squad-selection-section";

const squadSelection = readFileSync(
  path.join(import.meta.dirname, "squad-selection-section.tsx"),
  "utf8",
);
const tournamentSquad = readFileSync(
  path.join(
    import.meta.dirname,
    "..",
    "competitions",
    "tournament-squad-section.tsx",
  ),
  "utf8",
);
const matchSquad = readFileSync(
  path.join(import.meta.dirname, "..", "matches", "match-squad-section.tsx"),
  "utf8",
);

describe("sameSquadSelection", () => {
  it("ignores order and treats a different membership as a change", () => {
    expect(sameSquadSelection(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameSquadSelection(["a", "b"], ["a"])).toBe(false);
    expect(sameSquadSelection(["a"], ["a", "b"])).toBe(false);
    expect(sameSquadSelection([], [])).toBe(true);
  });
});

describe("tournament squad save", () => {
  it("writes the full squad once on Save", () => {
    expect(tournamentSquad).toContain("saveOnSubmit");
    expect(squadSelection).toContain('name="player_id"');
    expect(squadSelection).toContain("Saving…");
    expect(squadSelection).toContain("if (saveOnSubmit) return;");
    expect(matchSquad).not.toContain("saveOnSubmit");
  });
});
