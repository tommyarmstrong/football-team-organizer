import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("change match period format migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261112180000_change_match_period_format.sql",
    ),
    "utf8",
  );

  it("defines the function with the plan arguments", () => {
    expect(sql).toMatch(
      /create or replace function public\.change_match_period_format\(\s*p_match_id uuid,\s*p_keep jsonb,\s*p_merge jsonb,\s*p_create jsonb,\s*p_copy_starters_from uuid default null\s*\)/i,
    );
    expect(sql).toMatch(/returns void/i);
  });

  it("is SECURITY INVOKER and only granted to signed-in users", () => {
    expect(sql).toMatch(/security invoker/i);
    expect(sql).not.toMatch(/security definer/i);
    expect(sql).toMatch(
      /revoke all on function public\.change_match_period_format\(uuid, jsonb, jsonb, jsonb, uuid\) from public;/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.change_match_period_format\(uuid, jsonb, jsonb, jsonb, uuid\) to authenticated;/i,
    );
  });

  it("only runs for in-progress or played matches that exist", () => {
    expect(sql).toMatch(/raise exception 'Match not found\.'/);
    expect(sql).toMatch(/v_status not in \('in_progress', 'played'\)/);
  });

  it("checks every period in the plan belongs to the match", () => {
    expect(sql).toMatch(
      /raise exception 'Period does not belong to this match\.'/,
    );
    expect(sql).toContain("e ->> 'period_id'");
    expect(sql).toContain("e ->> 'into_period_id'");
    expect(sql).toMatch(/select p_copy_starters_from/);
  });

  it("renames kept periods and relabels their goals", () => {
    expect(sql).toMatch(
      /update public\.match_periods\s+set name = v_item ->> 'name',\s+sort_order = \(v_item ->> 'sort_order'\)::integer/,
    );
    expect(sql).toMatch(
      /update public\.goals\s+set period = v_item ->> 'name'\s+where match_id = p_match_id\s+and period_id = /,
    );
    expect(sql).toMatch(
      /and period_id is null\s+and period = v_item ->> 'from_name'/,
    );
  });

  it("moves merged goals onto the kept period before deleting the merged one", () => {
    const moveGoals = sql.indexOf(
      "set period_id = (v_item ->> 'into_period_id')::uuid",
    );
    const deletePeriod = sql.indexOf("delete from public.match_periods");
    expect(moveGoals).toBeGreaterThan(-1);
    expect(deletePeriod).toBeGreaterThan(moveGoals);
    expect(sql).toMatch(/period = v_into_name/);
  });

  it("renames first, merges second, then creates", () => {
    const rename = sql.indexOf("-- 1. Rename the periods that stay.");
    const merge = sql.indexOf("-- 2. Fold merged periods");
    const create = sql.indexOf("-- 3. Create the periods");
    expect(rename).toBeGreaterThan(-1);
    expect(merge).toBeGreaterThan(rename);
    expect(create).toBeGreaterThan(merge);
  });

  it("creates periods and copies starting players from the source period", () => {
    expect(sql).toMatch(
      /insert into public\.match_periods \(match_id, name, sort_order\)/,
    );
    expect(sql).toMatch(
      /insert into public\.match_period_starters \(period_id, player_id\)\s+select v_new_id, mps\.player_id\s+from public\.match_period_starters mps\s+where mps\.period_id = p_copy_starters_from/,
    );
  });

  it("aborts instead of skipping rows hidden by RLS", () => {
    expect(sql.match(/get diagnostics v_rows = row_count;/g)).toHaveLength(2);
    expect(sql.match(/if v_rows <> 1 then/g)).toHaveLength(2);
    expect(sql).toMatch(
      /raise exception 'You do not have permission to change this match\.'/,
    );
  });
});
