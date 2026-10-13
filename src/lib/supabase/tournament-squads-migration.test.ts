import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("tournament squads migration", () => {
  const sql = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20261012120000_tournament_squads.sql",
    ),
    "utf8",
  );

  it("stores a tournament squad of players", () => {
    expect(sql).toMatch(
      /create table public\.competition_players \([\s\S]*competition_id uuid not null references public\.competitions \(id\) on delete cascade,[\s\S]*player_id uuid not null references public\.players \(id\) on delete restrict,[\s\S]*unique \(competition_id, player_id\)/i,
    );
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/can_read_team\(c\.team_id\)/);
    expect(sql).toMatch(/can_edit_match_day\(c\.team_id\)/);
  });

  it("backfills existing tournaments with the active team squad", () => {
    expect(sql).toMatch(
      /insert into public\.competition_players \(competition_id, player_id\)[\s\S]*from public\.competitions c[\s\S]*join public\.team_players tp[\s\S]*tp\.active[\s\S]*where c\.kind = 'tournament'/i,
    );
  });
});
