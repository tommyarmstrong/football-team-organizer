import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tournament match defaults migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260929200000_tournament_match_defaults.sql",
    ),
    "utf8",
  );

  it("stores a shared tournament schedule only on tournament competitions", () => {
    expect(sql).toMatch(/add column date date/i);
    expect(sql).toMatch(/add column meetup_time time/i);
    expect(sql).toMatch(/add column home_away public\.match_home_away/i);
    expect(sql).toMatch(/kind = 'tournament'/i);
    expect(sql).toMatch(/date is null/i);
    expect(sql).toMatch(/meetup_time is null/i);
    expect(sql).toMatch(/home_away is null/i);
  });

  it("adds a match stage for cup and tournament fixtures", () => {
    expect(sql).toMatch(
      /create type public\.match_stage as enum \(\s*'group',\s*'final',\s*'semi_final',\s*'quarter_final',\s*'knockout'\s*\)/i,
    );
    expect(sql).toMatch(
      /alter table public\.matches\s+add column stage public\.match_stage/i,
    );
  });
});
