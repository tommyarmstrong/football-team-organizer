import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("period starts by player migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261103120000_period_starts_by_player.sql",
    ),
    "utf8",
  );

  it("counts starters of played matches for the requested team", () => {
    expect(sql).toMatch(/from public\.teams t/);
    expect(sql).toMatch(/join public\.match_period_starters mps/);
    expect(sql).toMatch(/m\.team_id\s+= t\.id/);
    expect(sql).toMatch(/t\.id = p_team_id/);
    expect(sql).toMatch(/m\.status = 'played'/);
  });

  it("returns one competition entry per period start", () => {
    expect(sql).toMatch(/count\(\*\)\s+as period_count/);
    expect(sql).toMatch(/jsonb_agg\(\s*jsonb_build_object\(/);
    for (const key of ["competitionId", "competitionKind", "isFriendly"]) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it("returns person_id, position and the count for each player", () => {
    for (const key of [
      "player_id",
      "person_id",
      "first_name",
      "last_name",
      "position",
      "count",
      "competitions",
    ]) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it("returns nothing unless the caller manages the club", () => {
    expect(sql).toMatch(/public\.is_club_management\(t\.club_id\)/);
    expect(sql).toMatch(/'\[\]'::jsonb/);
  });

  it("is SECURITY INVOKER and only granted to signed-in users", () => {
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(
      /revoke all on function public\.get_period_starts_by_player\(uuid\) from public;/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_period_starts_by_player\(uuid\) to authenticated;/i,
    );
  });
});
