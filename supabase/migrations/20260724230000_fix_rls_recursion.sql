-- Fix "infinite recursion detected in policy for relation player_guardians".
--
-- Policy expressions run as the invoking user, so any table referenced inside a
-- policy has its own RLS applied. That created a cycle:
--
--   teams_select / players_select  -> player_guardians
--   player_guardians_select        -> (select club_id from players ...)
--   players_select                 -> player_guardians ...
--
-- Every cross-table check now goes through a SECURITY DEFINER helper (which
-- bypasses RLS), and the helpers take the row's columns as arguments so
-- INSERT ... RETURNING never has to re-read the not-yet-visible new row.

create or replace function public.can_read_team_row(p_team_id uuid, p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = p_team_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = p_team_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.can_read_player_row(
  p_player_id uuid,
  p_club_id uuid,
  p_user_id uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or p_user_id = auth.uid()
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = p_player_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = p_player_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

-- Keep the single-argument helper (used by team-scoped tables) delegating to the
-- row variant so read rules live in one place.
create or replace function public.can_read_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select public.can_read_team_row(t.id, t.club_id) from public.teams t where t.id = p_team_id),
    false
  );
$$;

create or replace function public.can_read_club(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (select 1 from public.club_members cm where cm.club_id = p_club_id and cm.user_id = auth.uid())
    or exists (
      select 1 from public.teams t
      where t.club_id = p_club_id and public.can_read_team_row(t.id, t.club_id)
    );
$$;

create or replace function public.player_club_id(p_player_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.players where id = p_player_id;
$$;

revoke all on function public.can_read_team_row(uuid, uuid) from public;
revoke all on function public.can_read_player_row(uuid, uuid, uuid) from public;
revoke all on function public.can_read_club(uuid) from public;
revoke all on function public.player_club_id(uuid) from public;

grant execute on function public.can_read_team_row(uuid, uuid) to authenticated;
grant execute on function public.can_read_player_row(uuid, uuid, uuid) to authenticated;
grant execute on function public.can_read_club(uuid) to authenticated;
grant execute on function public.player_club_id(uuid) to authenticated;

-- clubs
drop policy if exists "clubs_select" on public.clubs;
create policy "clubs_select" on public.clubs for select to authenticated
  using (public.can_read_club(clubs.id));

-- teams
drop policy if exists "teams_select" on public.teams;
create policy "teams_select" on public.teams for select to authenticated
  using (public.can_read_team_row(teams.id, teams.club_id));

-- players
drop policy if exists "players_select" on public.players;
create policy "players_select" on public.players for select to authenticated
  using (public.can_read_player_row(players.id, players.club_id, players.user_id));

-- player_guardians: reach players through a definer helper, not a subquery.
drop policy if exists "player_guardians_select" on public.player_guardians;
create policy "player_guardians_select" on public.player_guardians for select to authenticated
  using (
    player_guardians.user_id = auth.uid()
    or public.is_club_staff(public.player_club_id(player_guardians.player_id))
  );

drop policy if exists "player_guardians_insert_staff" on public.player_guardians;
create policy "player_guardians_insert_staff" on public.player_guardians for insert to authenticated
  with check (public.is_club_staff(public.player_club_id(player_guardians.player_id)));

drop policy if exists "player_guardians_update_staff" on public.player_guardians;
create policy "player_guardians_update_staff" on public.player_guardians for update to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)))
  with check (public.is_club_staff(public.player_club_id(player_guardians.player_id)));

drop policy if exists "player_guardians_delete_staff" on public.player_guardians;
create policy "player_guardians_delete_staff" on public.player_guardians for delete to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)));
