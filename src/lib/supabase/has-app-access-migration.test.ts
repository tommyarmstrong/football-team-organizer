import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("restrict app access roles migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260908160000_restrict_app_access_roles.sql",
    ),
    "utf8",
  );

  it("replaces has_app_access without granting player-only access", () => {
    expect(sql).toMatch(
      /create or replace function public\.has_app_access\(\)/i,
    );
    expect(sql).toContain("from public.managers m");
    expect(sql).toContain("from public.guardians g");
    expect(sql).toContain("from public.team_members tm");
    expect(sql).toContain("'management'");
    expect(sql).toContain("'coach'");
    expect(sql).toContain("'guardian'");
    expect(sql).toContain("'guardian_assistant'");
    expect(sql).not.toMatch(/from public\.players\b/i);
    expect(sql).not.toMatch(/tm\.role\s*=\s*'player'/i);
    expect(sql).not.toMatch(/'player'\s*\)/);
  });

  it("keeps disabled-account exclusion on manager and guardian paths", () => {
    expect(sql).toMatch(/m\.active_role/);
    expect(sql).toMatch(/g\.active_role/);
    expect(sql).toMatch(/account_status is distinct from 'disabled'/);
  });
});
