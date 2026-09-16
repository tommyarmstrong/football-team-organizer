import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("get_team_stats RPC migration (§5.1 + §6.4)", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260916100000_get_team_stats_rpc.sql",
    ),
    "utf8",
  );

  it("creates the get_team_stats function", () => {
    expect(sql).toMatch(
      /create or replace function public\.get_team_stats\(p_team_id uuid\)/i,
    );
  });

  it("uses SECURITY INVOKER so RLS is evaluated for the calling user", () => {
    expect(sql).toMatch(/security invoker/i);
  });

  it("returns jsonb", () => {
    expect(sql).toMatch(/returns jsonb/i);
  });

  it("uses STABLE since it does not modify data", () => {
    expect(sql).toMatch(/\bstable\b/i);
  });

  it("filters played matches by team_id and status = 'played'", () => {
    expect(sql).toMatch(/team_id\s*=\s*p_team_id/i);
    expect(sql).toMatch(/status\s*=\s*'played'/i);
  });

  it("returns shirt_numbers key", () => {
    expect(sql).toMatch(/'shirt_numbers'/i);
    expect(sql).toMatch(/team_players/i);
  });

  it("returns goals_by_player with goal_competitions for client-side filtering", () => {
    expect(sql).toMatch(/'goals_by_player'/i);
    expect(sql).toMatch(/'goal_competitions'/i);
    expect(sql).toMatch(/'goals'/i);
    expect(sql).toMatch(/'matches_played'/i);
    expect(sql).toMatch(/'periods_played'/i);
  });

  it("uses match_period_starters for periods_played", () => {
    expect(sql).toMatch(/match_period_starters/i);
    expect(sql).toMatch(/match_periods/i);
  });

  it("returns assists_by_player", () => {
    expect(sql).toMatch(/'assists_by_player'/i);
    expect(sql).toMatch(/'assists'/i);
  });

  it("returns potm_by_player using player_of_the_match_id", () => {
    expect(sql).toMatch(/'potm_by_player'/i);
    expect(sql).toMatch(/player_of_the_match_id/i);
  });

  it("returns matches_played_by_player from match_players", () => {
    expect(sql).toMatch(/'matches_played_by_player'/i);
    expect(sql).toMatch(/match_players/i);
  });

  it("returns results_over_time with goals_for / goals_against", () => {
    expect(sql).toMatch(/'results_over_time'/i);
    expect(sql).toMatch(/'goals_for'/i);
    expect(sql).toMatch(/'goals_against'/i);
    expect(sql).toMatch(/'is_friendly'/i);
  });

  it("orders results chronologically", () => {
    expect(sql).toMatch(/order by rot\.date asc/i);
  });

  it("filters out opposition goals when aggregating team goals", () => {
    expect(sql).toMatch(/not g\.is_opposition/i);
  });

  it("joins competitions for competition_kind in stats entries", () => {
    expect(sql).toMatch(/'competitionKind'/i);
    expect(sql).toMatch(/'competitionId'/i);
    expect(sql).toMatch(/'isFriendly'/i);
  });

  it("revokes public execute permission and grants to authenticated only", () => {
    expect(sql).toMatch(
      /revoke all on function public\.get_team_stats\(uuid\) from public/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_team_stats\(uuid\) to authenticated/i,
    );
  });
});
