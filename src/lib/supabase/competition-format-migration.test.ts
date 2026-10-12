import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("competition format migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260929190000_competition_format.sql",
    ),
    "utf8",
  );

  it("replaces knockout with a format enum and backfills existing rows", () => {
    expect(sql).toMatch(
      /create type public\.competition_format as enum \(\s*'league',\s*'knockout',\s*'groups_and_knockout',\s*'other'\s*\)/i,
    );
    expect(sql).toMatch(/when knockout then 'knockout'/i);
    expect(sql).toMatch(/when kind = 'league' then 'league'/i);
    expect(sql).toMatch(/else 'other'/i);
    expect(sql).toMatch(/alter column format set default 'league'/i);
    expect(sql).toMatch(/alter column format set not null/i);
    expect(sql).toMatch(/drop column knockout/i);
  });
});
