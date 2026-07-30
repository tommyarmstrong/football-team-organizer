-- Fix clubs / players SELECT RLS so staff can reliably read clubs and
-- INSERT...RETURNING on players works the same way as the teams fix.
--
-- clubs_select previously joined club_members under that table's RLS, which
-- could leave getPrimaryClub() empty for management users who already have
-- visible teams. Use SECURITY DEFINER helpers instead.
--
-- players_select previously called can_read_player(id), which re-queries
-- public.players inside a helper. During INSERT...RETURNING that lookup can
-- miss the new row. Use the row's club_id / id columns directly.

drop policy if exists "clubs_select" on public.clubs;

create policy "clubs_select" on public.clubs for select to authenticated
  using (
    public.is_club_staff(clubs.id)
    or exists (
      select 1 from public.teams t
      where t.club_id = clubs.id and public.can_read_team(t.id)
    )
  );

drop policy if exists "players_select" on public.players;

create policy "players_select" on public.players for select to authenticated
  using (
    public.is_club_staff(players.club_id)
    or exists (
      select 1 from public.team_players tp
      where tp.player_id = players.id and public.can_read_team(tp.team_id)
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = players.id and pg.user_id = auth.uid()
    )
    or players.user_id = auth.uid()
  );
