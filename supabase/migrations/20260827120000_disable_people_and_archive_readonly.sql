-- Soft-delete people stay in the people table (account_status = disabled).
-- Archived teams keep historical rows visible but reject writes.

-- ---------------------------------------------------------------------------
-- Disabled accounts cannot use linked logins for app/management access
-- ---------------------------------------------------------------------------

create or replace function public.is_club_management(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.managers m
    join public.people p on p.id = m.person_id
    where m.club_id = p_club_id
      and m.active_role
      and p.account_status is distinct from 'disabled'
      and p.auth_user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_any_club()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.managers m
    join public.people p on p.id = m.person_id
    where m.active_role
      and p.account_status is distinct from 'disabled'
      and p.auth_user_id = auth.uid()
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
        and m.active_role
        and p.account_status is distinct from 'disabled'
    )
    or exists (
      select 1
      from public.team_members tm
      left join public.people p on p.auth_user_id = tm.user_id
      where tm.user_id = auth.uid()
        and (p.id is null or p.account_status is distinct from 'disabled')
    )
    or exists (
      select 1
      from public.guardians g
      join public.people p on p.id = g.person_id
      where p.auth_user_id = auth.uid()
        and g.active_role
        and p.account_status is distinct from 'disabled'
    )
    or exists (
      select 1
      from public.players pl
      join public.people p on p.id = pl.person_id
      where p.auth_user_id = auth.uid()
        and pl.active_role
        and p.account_status is distinct from 'disabled'
    );
$$;

-- ---------------------------------------------------------------------------
-- Archived teams: historical data is read-only
-- ---------------------------------------------------------------------------

create or replace function public.team_is_archived(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and t.archived_at is not null
  );
$$;

revoke all on function public.team_is_archived(uuid) from public;
grant execute on function public.team_is_archived(uuid) to authenticated;

create or replace function public.can_edit_match_day(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    not public.team_is_archived(p_team_id)
    and (
      public.is_club_management((select club_id from public.teams where id = p_team_id))
      or exists (
        select 1 from public.team_members tm
        where tm.team_id = p_team_id
          and tm.user_id = auth.uid()
          and tm.role::text in ('coach', 'management', 'guardian_assistant')
      )
    );
$$;

create or replace function public.can_mutate_team_history(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_edit_team(p_team_id)
    and not public.team_is_archived(p_team_id);
$$;

revoke all on function public.can_mutate_team_history(uuid) from public;
grant execute on function public.can_mutate_team_history(uuid) to authenticated;

-- Playing squad
drop policy if exists "team_players_insert" on public.team_players;
create policy "team_players_insert" on public.team_players for insert to authenticated
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_players_update" on public.team_players;
create policy "team_players_update" on public.team_players for update to authenticated
  using (public.can_mutate_team_history(team_id))
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_players_delete" on public.team_players;
create policy "team_players_delete" on public.team_players for delete to authenticated
  using (public.can_mutate_team_history(team_id));

-- Coaching staff
drop policy if exists "team_coaches_insert" on public.team_coaches;
create policy "team_coaches_insert" on public.team_coaches for insert to authenticated
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_coaches_update" on public.team_coaches;
create policy "team_coaches_update" on public.team_coaches for update to authenticated
  using (public.can_mutate_team_history(team_id))
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_coaches_delete" on public.team_coaches;
create policy "team_coaches_delete" on public.team_coaches for delete to authenticated
  using (public.can_mutate_team_history(team_id));

-- Competitions
drop policy if exists "competitions_insert" on public.competitions;
create policy "competitions_insert" on public.competitions for insert to authenticated
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "competitions_update" on public.competitions;
create policy "competitions_update" on public.competitions for update to authenticated
  using (public.can_mutate_team_history(team_id))
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "competitions_delete" on public.competitions;
create policy "competitions_delete" on public.competitions for delete to authenticated
  using (public.can_mutate_team_history(team_id));

-- Team access roster (guardian assistants, coaches, etc.)
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members for insert to authenticated
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_members_update" on public.team_members;
create policy "team_members_update" on public.team_members for update to authenticated
  using (public.can_mutate_team_history(team_id))
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete" on public.team_members for delete to authenticated
  using (public.can_mutate_team_history(team_id));

-- Player of the month
drop policy if exists "player_of_the_month_insert_edit" on public.player_of_the_month;
create policy "player_of_the_month_insert_edit"
  on public.player_of_the_month for insert
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "player_of_the_month_update_edit" on public.player_of_the_month;
create policy "player_of_the_month_update_edit"
  on public.player_of_the_month for update
  using (public.can_mutate_team_history(team_id))
  with check (public.can_mutate_team_history(team_id));

drop policy if exists "player_of_the_month_delete_edit" on public.player_of_the_month;
create policy "player_of_the_month_delete_edit"
  on public.player_of_the_month for delete
  using (public.can_mutate_team_history(team_id));
