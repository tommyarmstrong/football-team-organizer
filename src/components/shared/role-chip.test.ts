import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "role-chip.tsx"),
  "utf8",
);

describe("PersonRoleChips", () => {
  it("does not use primary or destructive red for the player chip", () => {
    expect(source).toMatch(
      /player:\s*"border-chart-1\/40 bg-chart-1\/10 text-chart-1"/,
    );
    const playerLine = source
      .split("\n")
      .find((line) => line.includes("player:"));
    expect(playerLine).not.toMatch(/primary|destructive|red-/);
  });
});
