-- Guardians can view all coaches in their club, see those coaches' team
-- assignments, and edit name/contact/DOB/school for people they guardian.

create or replace function public.is_club_guardian(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.guardians g
      join public.people pe on pe.id = g.person_id
      where g.club_id = p_club_id
        and g.active_role
        and pe.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where t.club_id = p_club_id
        and tm.user_id = auth.uid()
        and tm.role::text in ('guardian', 'guardian_assistant')
    );
$$;

revoke all on function public.is_club_guardian(uuid) from public;
grant execute on function public.is_club_guardian(uuid) to authenticated;

create or replace function public.is_guardian_of_person(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players pl
    join public.player_guardians pg on pg.player_id = pl.id
    join public.guardians g on g.id = pg.guardian_id
    join public.people pe on pe.id = g.person_id
    where pl.person_id = p_person_id
      and pe.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.is_guardian_of_person(uuid) from public;
grant execute on function public.is_guardian_of_person(uuid) to authenticated;

create or replace function public.is_guardian_of_player(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_guardians pg
    join public.guardians g on g.id = pg.guardian_id
    join public.people pe on pe.id = g.person_id
    where pg.player_id = p_player_id
      and pe.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.is_guardian_of_player(uuid) from public;
grant execute on function public.is_guardian_of_player(uuid) to authenticated;

create or replace function public.can_read_person(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.people pe
      where pe.id = p_person_id
        and pe.auth_user_id = auth.uid()
    )
    or public.can_manage_any_club()
    or exists (
      select 1 from public.managers m
      where m.person_id = p_person_id
        and public.is_club_staff(m.club_id)
    )
    or exists (
      select 1 from public.coaches c
      where c.person_id = p_person_id
        and (
          public.is_club_staff(c.club_id)
          or public.is_club_guardian(c.club_id)
        )
    )
    or exists (
      select 1 from public.guardians g
      where g.person_id = p_person_id
        and public.is_club_staff(g.club_id)
    )
    or exists (
      select 1 from public.players pl
      where pl.person_id = p_person_id
        and public.is_club_staff(pl.club_id)
    )
    or exists (
      select 1
      from public.players pl
      join public.player_guardians pg on pg.player_id = pl.id
      join public.guardians g on g.id = pg.guardian_id
      join public.people pe on pe.id = g.person_id
      where pl.person_id = p_person_id
        and pe.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      join public.teams t on t.id = tp.team_id
      where pl.person_id = p_person_id
        and public.can_read_team_row(t.id, t.club_id)
    )
    or exists (
      select 1
      from public.coaches c
      join public.team_coaches tc on tc.coach_id = c.id
      join public.teams t on t.id = tc.team_id
      where c.person_id = p_person_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

drop policy if exists "coaches_select" on public.coaches;
create policy "coaches_select" on public.coaches for select to authenticated
  using (
    public.is_club_staff(coaches.club_id)
    or public.is_club_guardian(coaches.club_id)
    or public.person_auth_user_id(coaches.person_id) = auth.uid()
    or exists (
      select 1
      from public.team_coaches tc
      join public.teams t on t.id = tc.team_id
      where tc.coach_id = coaches.id
        and public.can_read_team_row(t.id, t.club_id)
    )
  );

drop policy if exists "people_update" on public.people;
create policy "people_update" on public.people for update to authenticated
  using (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
    or public.is_guardian_of_person(people.id)
  )
  with check (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
    or public.is_guardian_of_person(people.id)
  );

drop policy if exists "players_update_guardian" on public.players;
create policy "players_update_guardian" on public.players for update to authenticated
  using (public.is_guardian_of_player(id))
  with check (public.is_guardian_of_player(id));

drop policy if exists "team_coaches_select" on public.team_coaches;
create policy "team_coaches_select" on public.team_coaches for select to authenticated
  using (
    public.can_read_team(team_id)
    or exists (
      select 1
      from public.coaches c
      where c.id = team_coaches.coach_id
        and public.is_club_guardian(c.club_id)
    )
  );

create or replace function public.list_visible_coach_teams(p_coach_id uuid)
returns table (
  team_coach_id uuid,
  team_id uuid,
  team_name text,
  team_season_label text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    tc.id,
    tc.team_id,
    t.name,
    t.season_label,
    tc.role
  from public.team_coaches tc
  join public.teams t on t.id = tc.team_id
  join public.coaches c on c.id = tc.coach_id
  where tc.coach_id = p_coach_id
    and (
      public.can_read_team(tc.team_id)
      or public.is_club_staff(c.club_id)
      or public.is_club_guardian(c.club_id)
      or public.person_auth_user_id(c.person_id) = auth.uid()
    );
$$;

revoke all on function public.list_visible_coach_teams(uuid) from public;
grant execute on function public.list_visible_coach_teams(uuid) to authenticated;
