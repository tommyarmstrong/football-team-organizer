import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("player and coach team assignment labels", () => {
  const player = readFileSync(
    path.join(import.meta.dirname, "player-teams-section.tsx"),
    "utf8",
  );
  const coach = readFileSync(
    path.join(import.meta.dirname, "../coaches/coach-teams-section.tsx"),
    "utf8",
  );

  it("shows team name and season in the assign-to-team options", () => {
    expect(player).toContain("teamAssignmentOptionLabel");
    expect(coach).toContain("teamAssignmentOptionLabel");
    expect(coach).toContain('htmlFor="coach-team">Assign to team');
  });
});
