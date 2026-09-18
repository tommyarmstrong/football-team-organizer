import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("team staff rows", () => {
  const source = readFileSync(
    path.join(import.meta.dirname, "team-staff-section.tsx"),
    "utf8",
  );

  it("show club-colour initials next to the name", () => {
    expect(source).toContain("InitialsAvatar");
    expect(source).toContain('className="size-9"');
  });
});
