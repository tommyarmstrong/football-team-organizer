import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("period starters cleanup on squad removal migration", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20261105120000_cleanup_period_starters_on_squad_removal.sql",
    ),
    "utf8",
  );

  it("fires after a row is deleted from match_players, once per row", () => {
    expect(sql).toMatch(
      /create trigger match_players_delete_period_starters\s+after delete on public\.match_players\s+for each row/i,
    );
    expect(sql).toMatch(
      /execute function public\.delete_period_starters_for_removed_squad_player\(\)/i,
    );
  });

  it("only deletes starters for the removed player in the same match", () => {
    expect(sql).toMatch(/delete from public\.match_period_starters mps/i);
    expect(sql).toMatch(/using public\.match_periods mp/i);
    expect(sql).toMatch(/mp\.id = mps\.period_id/);
    expect(sql).toMatch(/mp\.match_id = old\.match_id/);
    expect(sql).toMatch(/mps\.player_id = old\.player_id/);
  });

  it("is SECURITY DEFINER with a fixed search_path and no public execute", () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path = public/i);
    expect(sql).toMatch(
      /revoke all on function public\.delete_period_starters_for_removed_squad_player\(\)\s+from public;/i,
    );
  });

  it("can be re-applied safely", () => {
    expect(sql).toMatch(/create or replace function/i);
    expect(sql).toMatch(
      /drop trigger if exists match_players_delete_period_starters/i,
    );
  });
});
