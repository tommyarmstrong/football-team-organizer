import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("restrict club create migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260908140000_restrict_club_create_to_managers.sql",
    ),
    "utf8",
  );

  it("requires existing club management before creating a club", () => {
    expect(sql).toContain("can_manage_any_club()");
    expect(sql).toContain("Only club management can create clubs");
    expect(sql).toContain("No person linked to this account");
    expect(sql).not.toMatch(/insert into public\.people/i);
  });
});
