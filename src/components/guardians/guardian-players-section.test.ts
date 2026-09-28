import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("linking a player on the guardian page", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "guardian-players-section.tsx"),
    "utf8",
  );

  it("keeps the player picker beside relationship and the checkboxes below on desktop", () => {
    const form = source.slice(source.indexOf("function LinkPlayerForm"));
    const gridAt = form.indexOf('className="grid gap-3 sm:grid-cols-2"');
    const playerAt = form.indexOf('id="guardian-player"');
    const checksAt = form.indexOf("Legal guardian");
    expect(gridAt).toBeGreaterThan(-1);
    expect(playerAt).toBeGreaterThan(gridAt);
    expect(checksAt).toBeGreaterThan(playerAt);
    expect(form).toContain(
      'className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"',
    );
  });
});
