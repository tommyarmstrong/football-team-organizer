import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("get_viewer_context RPC migration (§4.1 + §6.2)", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260916000000_get_viewer_context_rpc.sql",
    ),
    "utf8",
  );

  it("creates the get_viewer_context function", () => {
    expect(sql).toMatch(
      /create or replace function public\.get_viewer_context\(\)/i,
    );
  });

  it("uses SECURITY DEFINER to avoid RLS recursion across joined tables", () => {
    expect(sql).toMatch(/security definer/i);
  });

  it("returns JSONB", () => {
    expect(sql).toMatch(/returns jsonb/i);
  });

  it("guards against unauthenticated calls via auth.uid() null check", () => {
    expect(sql).toMatch(/v_uid\s*:=\s*auth\.uid\(\)/i);
    expect(sql).toMatch(/if v_uid is null then/i);
    expect(sql).toMatch(/return null/i);
  });

  it("resolves the person row by auth_user_id", () => {
    expect(sql).toMatch(/from public\.people/i);
    expect(sql).toMatch(/where auth_user_id = v_uid/i);
  });

  it("fetches manager club memberships", () => {
    expect(sql).toMatch(/from public\.managers/i);
    expect(sql).toMatch(/'club_id'/i);
  });

  it("fetches team_members roles", () => {
    expect(sql).toMatch(/from public\.team_members/i);
    expect(sql).toMatch(/'team_id'/i);
    expect(sql).toMatch(/'role'/i);
  });

  it("fetches guardians with nested player_guardians", () => {
    expect(sql).toMatch(/from public\.guardians/i);
    expect(sql).toMatch(/from public\.player_guardians/i);
    expect(sql).toMatch(/'player_guardians'/i);
    expect(sql).toMatch(/'player_id'/i);
  });

  it("fetches self_players by person_id", () => {
    expect(sql).toMatch(/from public\.players/i);
    expect(sql).toMatch(/'self_players'/i);
  });

  it("fetches RLS-visible teams using can_read_team_row", () => {
    expect(sql).toMatch(/from public\.teams/i);
    expect(sql).toMatch(/can_read_team_row/i);
    expect(sql).toMatch(/'teams'/i);
  });

  it("fetches RLS-visible clubs using can_read_club (§4.1 composite header data)", () => {
    expect(sql).toMatch(/from public\.clubs/i);
    expect(sql).toMatch(/can_read_club/i);
    expect(sql).toMatch(/'clubs'/i);
  });

  it("revokes public execute permission and grants to authenticated only", () => {
    expect(sql).toMatch(
      /revoke all on function public\.get_viewer_context\(\) from public/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_viewer_context\(\) to authenticated/i,
    );
  });
});
