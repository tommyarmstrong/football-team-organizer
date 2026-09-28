import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("linking a guardian on the player page", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "player-guardians-section.tsx"),
    "utf8",
  );

  it("gives the guardian picker its own column on desktop", () => {
    const form = source.slice(source.indexOf("function LinkGuardianForm"));
    const gridAt = form.indexOf('className="grid gap-3 sm:grid-cols-2"');
    const guardianAt = form.indexOf('id="player-guardian"');
    const checksAt = form.indexOf("Legal guardian");
    expect(gridAt).toBeGreaterThan(-1);
    expect(guardianAt).toBeGreaterThan(gridAt);
    expect(checksAt).toBeGreaterThan(guardianAt);
    expect(form).toContain(
      'className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"',
    );
  });
});
