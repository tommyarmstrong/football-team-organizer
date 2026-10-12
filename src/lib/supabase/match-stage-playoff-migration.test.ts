import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("match stage playoff migration", () => {
  const sql = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20261012000000_match_stage_playoff.sql",
    ),
    "utf8",
  );

  it("adds playoff and playoff final to the match stage enum", () => {
    expect(sql).toMatch(
      /alter type public\.match_stage add value if not exists 'playoff'/i,
    );
    expect(sql).toMatch(
      /alter type public\.match_stage add value if not exists 'playoff_final'/i,
    );
  });
});
