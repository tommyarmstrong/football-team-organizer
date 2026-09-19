import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initialsFromName } from "@/components/shared/initials-avatar";

const source = readFileSync(
  path.join(import.meta.dirname, "initials-avatar.tsx"),
  "utf8",
);

describe("initialsFromName", () => {
  it("uses the first letter of the first two words", () => {
    expect(initialsFromName("Harry Kane")).toBe("HK");
  });

  it("handles a single name", () => {
    expect(initialsFromName("Neymar")).toBe("N");
  });

  it("falls back when the name is blank", () => {
    expect(initialsFromName("   ")).toBe("?");
  });
});

describe("InitialsAvatar", () => {
  it("uses club colour (primary), not destructive red", () => {
    expect(source).toContain("bg-primary/12 text-primary");
    expect(source).not.toMatch(/destructive|text-red-|bg-red-/);
  });
});
