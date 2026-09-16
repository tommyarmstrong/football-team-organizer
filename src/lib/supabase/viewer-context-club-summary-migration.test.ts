import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("get_viewer_context club summary (§6.3)", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260916200000_viewer_context_club_summary.sql",
    ),
    "utf8",
  );

  it("replaces get_viewer_context and selects club summary columns only", () => {
    expect(sql).toMatch(
      /create or replace function public\.get_viewer_context\(\)/i,
    );
    expect(sql).toMatch(/'id',\s*c\.id/);
    expect(sql).toMatch(/'name',\s*c\.name/);
    expect(sql).toMatch(/'colour',\s*c\.colour/);
    expect(sql).toMatch(/'icon_url',\s*c\.icon_url/);
    expect(sql).not.toMatch(/jsonb_agg\(\s*to_jsonb\(c\.\*\)/);
  });
});
