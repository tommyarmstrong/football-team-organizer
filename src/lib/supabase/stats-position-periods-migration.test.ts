import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("stats position and periods migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261020140000_stats_position_and_periods.sql",
    ),
    "utf8",
  );

  const assistsCte = sql.slice(
    sql.indexOf("assists_by_player as ("),
    sql.indexOf("assist_appearances as ("),
  );
  const appearancesCte = sql.slice(
    sql.indexOf("matches_played_by_player as ("),
    sql.indexOf("results_over_time as ("),
  );
  const assistsJson = sql.slice(
    sql.indexOf("'assists_by_player'"),
    sql.indexOf("'potm_by_player'"),
  );
  const appearancesJson = sql.slice(
    sql.indexOf("'matches_played_by_player'"),
    sql.indexOf("'results_over_time'"),
  );

  it("returns playing position for assists and appearances", () => {
    expect(assistsCte).toMatch(/pl\.position/);
    expect(appearancesCte).toMatch(/pl\.position/);
    expect(assistsJson).toMatch(/'position'/);
    expect(appearancesJson).toMatch(/'position'/);
  });

  it("returns periods played for assists and appearances", () => {
    expect(assistsJson).toMatch(/'periods_played'/);
    expect(appearancesJson).toMatch(/'periods_played'/);
    expect(assistsJson).toMatch(/goal_scorer_periods/);
    expect(appearancesJson).toMatch(/goal_scorer_periods/);
  });
});
