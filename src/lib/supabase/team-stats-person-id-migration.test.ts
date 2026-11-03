import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("team stats person_id migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261102120000_team_stats_person_id.sql",
    ),
    "utf8",
  );

  function section(start: string, end: string): string {
    const from = sql.indexOf(start);
    const to = sql.indexOf(end, from);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    return sql.slice(from, to);
  }

  it("selects and groups person_id in every per-player CTE", () => {
    const goals = section("goals_by_player as (", "assists_by_player as (");
    const assists = section(
      "assists_by_player as (",
      "assist_appearances as (",
    );
    const potm = section(
      "potm_by_player as (",
      "player_of_the_month_by_player as (",
    );
    const monthly = section(
      "player_of_the_month_by_player as (",
      "matches_played_by_player as (",
    );
    const appearances = section(
      "matches_played_by_player as (",
      "results_over_time as (",
    );
    for (const cte of [goals, assists, potm, monthly, appearances]) {
      expect(cte).toMatch(/pl\.person_id,/);
      expect(cte).toMatch(/group by pl\.id, pl\.person_id,/);
    }
  });

  it("returns person_id in each player series", () => {
    expect(sql).toMatch(/'person_id',\s+gbp\.person_id/);
    expect(sql).toMatch(/'person_id',\s+abp\.person_id/);
    expect(sql).toMatch(/'person_id',\s+ppp\.person_id/);
    expect(sql).toMatch(/'person_id',\s+pom\.person_id/);
    expect(sql).toMatch(/'person_id',\s+mpp\.person_id/);
  });

  it("keeps the function SECURITY INVOKER and its grants", () => {
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(
      /revoke all on function public\.get_team_stats\(uuid\) from public;/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_team_stats\(uuid\) to authenticated;/i,
    );
  });
});
