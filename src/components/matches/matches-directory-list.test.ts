import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(import.meta.dirname, "matches-directory-list.tsx"),
  "utf8",
);

describe("MatchesDirectoryList", () => {
  it("uses standard text colour for competition names", () => {
    expect(source).toContain('<p className="text-center text-sm font-bold">');
    expect(source).not.toMatch(/text-primary text-center text-sm font-bold/);
  });

  it("keeps Scheduled in red", () => {
    expect(source).toContain(
      'className="text-center text-sm font-medium text-red-600 dark:text-red-400"',
    );
    expect(source).toMatch(/>\s*Scheduled\s*</);
  });
});
