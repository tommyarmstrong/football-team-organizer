import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("period starts by type migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261104120000_period_starts_by_type.sql",
    ),
    "utf8",
  );

  it("replaces the period starts function with the same signature", () => {
    expect(sql).toMatch(
      /create or replace function public\.get_period_starts_by_player\(p_team_id uuid\)/i,
    );
  });

  it("groups period names into quarters, halves and extra time", () => {
    expect(sql).toMatch(/mpd\.name like 'Quarter %'\s+then 'quarters'/);
    expect(sql).toMatch(
      /mpd\.name in \('First half', 'Second half'\)\s+then 'halves'/,
    );
    expect(sql).toMatch(/mpd\.name like 'Extra time %'\s+then 'extra_time'/);
    expect(sql).toMatch(/else 'other'/);
  });

  it("adds periodType to every competition entry and returns periods_in_games", () => {
    expect(sql.match(/'periodType',\s+\w+\.period_type/g)).toHaveLength(2);
    expect(sql).toContain("'periods_in_games'");
    for (const key of ["competitionId", "competitionKind", "isFriendly"]) {
      expect(sql.split(`'${key}'`).length - 1).toBe(2);
    }
  });

  it("counts every period of the played matches a player was in", () => {
    expect(sql).toMatch(/from public\.match_players mp/);
    expect(sql).toMatch(/\bunion\b/);
    expect(sql).toMatch(
      /join played_periods pp on pp\.match_id = pg\.match_id/,
    );
    expect(sql).toMatch(/m\.status = 'played'/);
  });

  it("keeps the club-management guard and the existing keys", () => {
    expect(sql).toMatch(/public\.is_club_management\(t\.club_id\)/);
    expect(sql).toMatch(/'\[\]'::jsonb/);
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
