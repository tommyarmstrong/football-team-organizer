-- Point auth helpers at people.auth_user_id, then drop duplicated identity
-- columns from role tables (data already copied in the previous migration).

-- ---------------------------------------------------------------------------
-- Helpers: resolve auth via people
-- ---------------------------------------------------------------------------

create or replace function public.person_auth_user_id(p_person_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select auth_user_id from public.people where id = p_person_id;
$$;

create or replace function public.player_auth_user_id(p_player_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select p.auth_user_id
  from public.players pl
  join public.people p on p.id = pl.person_id
  where pl.id = p_player_id;
$$;

create or replace function public.guardian_auth_user_id(p_guardian_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select p.auth_user_id
  from public.guardians g
  join public.people p on p.id = g.person_id
  where g.id = p_guardian_id;
$$;

revoke all on function public.person_auth_user_id(uuid) from public;
revoke all on function public.player_auth_user_id(uuid) from public;
revoke all on function public.guardian_auth_user_id(uuid) from public;
grant execute on function public.person_auth_user_id(uuid) to authenticated;
grant execute on function public.player_auth_user_id(uuid) to authenticated;
grant execute on function public.guardian_auth_user_id(uuid) to authenticated;

create or replace function public.is_club_management(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.managers m
    join public.people p on p.id = m.person_id
    where m.club_id = p_club_id
      and p.auth_user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_any_club()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.managers m
    join public.people p on p.id = m.person_id
    where p.auth_user_id = auth.uid()
  );
$$;

create or replace function public.has_app_access()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1
      from public.managers m
      join public.people p on p.id = m.person_id
      where p.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_members tm where tm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.guardians g
      join public.people p on p.id = g.person_id
      where p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.players pl
      join public.people p on p.id = pl.person_id
      where p.auth_user_id = auth.uid()
    );
$$;

create or replace function public.can_read_club(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (
      select 1
      from public.managers m
      join public.people p on p.id = m.person_id
      where m.club_id = p_club_id and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.teams t
      where t.club_id = p_club_id and public.can_read_team_row(t.id, t.club_id)
    );
$$;

create or replace function public.can_read_team_row(p_team_id uuid, p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.player_guardians pg
      join public.guardians g on g.id = pg.guardian_id
      join public.people pe on pe.id = g.person_id
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = p_team_id and pe.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.players pl
      join public.people pe on pe.id = pl.person_id
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = p_team_id and pe.auth_user_id = auth.uid()
    );
$$;

-- Replace prior helper that took players.user_id as the third argument.
drop function if exists public.can_read_player_row(uuid, uuid, uuid);

create or replace function public.can_read_player_row(
  p_player_id uuid,
  p_club_id uuid,
  p_person_id uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or public.person_auth_user_id(p_person_id) = auth.uid()
    or exists (
      select 1
      from public.player_guardians pg
      join public.guardians g on g.id = pg.guardian_id
      join public.people pe on pe.id = g.person_id
      where pg.player_id = p_player_id and pe.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = p_player_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

revoke all on function public.can_read_player_row(uuid, uuid, uuid) from public;
grant execute on function public.can_read_player_row(uuid, uuid, uuid) to authenticated;

create or replace function public.can_read_player(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select public.can_read_player_row(pl.id, pl.club_id, pl.person_id)
      from public.players pl
      where pl.id = p_player_id
    ),
    false
  );
$$;

create or replace function public.can_view_player_contact(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.can_edit_player(p_player_id)
    or exists (
      select 1
      from public.player_guardians pg
      join public.guardians g on g.id = pg.guardian_id
      join public.people pe on pe.id = g.person_id
      where pg.player_id = p_player_id and pe.auth_user_id = auth.uid()
    )
    or public.player_auth_user_id(p_player_id) = auth.uid();
$$;

create or replace function public.create_club_with_management(p_name text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
  v_person_id uuid;
  v_first text;
  v_last text;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_email := nullif(lower(trim(auth.jwt() ->> 'email')), '');
  v_first := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'first_name'), ''),
    nullif(trim(split_part(coalesce(auth.jwt() ->> 'email', 'Club'), '@', 1)), ''),
    'Club'
  );
  v_last := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'last_name'), ''),
    'Manager'
  );

  insert into public.clubs (name) values (p_name) returning * into v_club;

  select id into v_person_id
  from public.people
  where auth_user_id = auth.uid()
  limit 1;

  if v_person_id is null then
    insert into public.people (
      first_name, last_name, email, auth_user_id, account_status
    ) values (
      v_first,
      v_last,
      v_email,
      auth.uid(),
      'active'::public.person_account_status
    )
    returning id into v_person_id;
  end if;

  insert into public.managers (club_id, person_id)
  values (v_club.id, v_person_id);

  return v_club;
end;
$$;

-- ---------------------------------------------------------------------------
-- Update RLS policies that referenced role.user_id
-- ---------------------------------------------------------------------------

drop policy if exists "managers_select" on public.managers;
create policy "managers_select" on public.managers for select to authenticated
  using (
    public.person_auth_user_id(managers.person_id) = auth.uid()
    or public.is_club_staff(managers.club_id)
  );

drop policy if exists "guardians_select" on public.guardians;
create policy "guardians_select" on public.guardians for select to authenticated
  using (
    public.person_auth_user_id(guardians.person_id) = auth.uid()
    or public.is_club_staff(guardians.club_id)
  );

drop policy if exists "player_guardians_select" on public.player_guardians;
create policy "player_guardians_select" on public.player_guardians for select to authenticated
  using (
    exists (
      select 1 from public.guardians g
      where g.id = player_guardians.guardian_id
        and public.person_auth_user_id(g.person_id) = auth.uid()
    )
    or public.is_club_staff(public.player_club_id(player_guardians.player_id))
  );

drop policy if exists "players_select" on public.players;
create policy "players_select" on public.players for select to authenticated
  using (
    public.can_read_player_row(players.id, players.club_id, players.person_id)
  );

drop index if exists public.managers_club_user_unique;
drop index if exists public.managers_user_id_idx;
drop index if exists public.guardians_user_id_idx;
drop index if exists public.players_user_id_idx;

alter table public.managers
  drop column if exists user_id,
  drop column if exists first_name,
  drop column if exists second_name,
  drop column if exists phone,
  drop column if exists email;

alter table public.coaches
  drop column if exists first_name,
  drop column if exists second_name,
  drop column if exists phone,
  drop column if exists email;

alter table public.guardians
  drop column if exists user_id,
  drop column if exists first_name,
  drop column if exists second_name,
  drop column if exists phone,
  drop column if exists email;

alter table public.players
  drop column if exists user_id,
  drop column if exists first_name,
  drop column if exists last_name;
