-- Fix teams SELECT RLS so INSERT...RETURNING works for club management.
--
-- teams_select previously used can_read_team(id), which re-queries public.teams
-- inside a helper. During INSERT...RETURNING that lookup cannot see the new row
-- yet, so club_id resolves to null, the SELECT policy fails, and PostgREST
-- reports: new row violates row-level security policy for table "teams".
--
-- Use the row's club_id (and id) columns directly instead.

drop policy if exists "teams_select" on public.teams;

create policy "teams_select" on public.teams for select to authenticated
  using (
    public.is_club_staff(teams.club_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = teams.id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = teams.id and pl.user_id = auth.uid()
    )
  );
