import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("played match appearances", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260928120000_played_match_appearances.sql",
    ),
    "utf8",
  );

  it("counts appearances from played match-day squads only", () => {
    const appearances = sql.slice(
      sql.indexOf("matches_played_by_player as ("),
      sql.indexOf("results_over_time as ("),
    );
    expect(appearances).toMatch(
      /join played_matches\s+pm on pm\.id = mp\.match_id/i,
    );
    expect(appearances).not.toMatch(/where m\.team_id = p_team_id/i);
    expect(sql).toMatch(/goal_scorer_appearances as \(/i);
    expect(sql).toMatch(/assist_appearances as \(/i);
    expect(sql).toMatch(/mp\.match_id in \(select id from played_matches\)/i);
  });
});

describe("getMatchesPlayedByPlayerStats", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/lib/data/stats.ts"),
    "utf8",
  );

  it("limits squad appearances to played matches", () => {
    const fn = source.slice(
      source.indexOf("export async function getMatchesPlayedByPlayerStats"),
      source.indexOf("export async function getResultsOverTime"),
    );
    expect(fn).toContain('.eq("match.status", "played")');
  });
});
