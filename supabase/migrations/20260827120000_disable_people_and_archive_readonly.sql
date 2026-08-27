-- Soft-delete people (account_status=disabled) is enforced in the app layer.
-- Archived teams: historical data (squad, staff, competitions, matches, goals,
-- periods, cards, POTM, team members) becomes read-only at the data layer.

create or replace function public.team_not_archived(p_team_id uuid)
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
      and t.archived_at is null
  );
$$;

revoke all on function public.team_not_archived(uuid) from public;
grant execute on function public.team_not_archived(uuid) to authenticated;

comment on function public.team_not_archived(uuid) is
  'True when the team exists and is not archived.';

-- Team data mutations (squad, staff, competitions, members, POTM) require an
-- active (non-archived) season in addition to existing edit rights.
create or replace function public.can_mutate_team_data(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_edit_team(p_team_id)
    and public.team_not_archived(p_team_id);
$$;

revoke all on function public.can_mutate_team_data(uuid) from public;
grant execute on function public.can_mutate_team_data(uuid) to authenticated;

-- Match-day writes also blocked on archived seasons.
create or replace function public.can_edit_match_day(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.team_not_archived(p_team_id)
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

create or replace function public.can_edit_match_goals(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_edit_match_day(p_team_id);
$$;

-- ---------------------------------------------------------------------------
-- Historical tables: use can_mutate_team_data instead of can_edit_team
-- ---------------------------------------------------------------------------

-- team_members (roles / guardian assistants)
drop policy if exists "team_members_insert" on public.team_members;
create policy "team_members_insert" on public.team_members for insert to authenticated
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_members_update" on public.team_members;
create policy "team_members_update" on public.team_members for update to authenticated
  using (public.can_mutate_team_data(team_id))
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete" on public.team_members for delete to authenticated
  using (public.can_mutate_team_data(team_id));

-- team_players (playing squad)
drop policy if exists "team_players_insert" on public.team_players;
create policy "team_players_insert" on public.team_players for insert to authenticated
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_players_update" on public.team_players;
create policy "team_players_update" on public.team_players for update to authenticated
  using (public.can_mutate_team_data(team_id))
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_players_delete" on public.team_players;
create policy "team_players_delete" on public.team_players for delete to authenticated
  using (public.can_mutate_team_data(team_id));

-- team_coaches
drop policy if exists "team_coaches_insert" on public.team_coaches;
create policy "team_coaches_insert" on public.team_coaches for insert to authenticated
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_coaches_update" on public.team_coaches;
create policy "team_coaches_update" on public.team_coaches for update to authenticated
  using (public.can_mutate_team_data(team_id))
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "team_coaches_delete" on public.team_coaches;
create policy "team_coaches_delete" on public.team_coaches for delete to authenticated
  using (public.can_mutate_team_data(team_id));

-- competitions
drop policy if exists "competitions_insert" on public.competitions;
create policy "competitions_insert" on public.competitions for insert to authenticated
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "competitions_update" on public.competitions;
create policy "competitions_update" on public.competitions for update to authenticated
  using (public.can_mutate_team_data(team_id))
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "competitions_delete" on public.competitions;
create policy "competitions_delete" on public.competitions for delete to authenticated
  using (public.can_mutate_team_data(team_id));

-- player of the month
drop policy if exists "player_of_the_month_insert_edit" on public.player_of_the_month;
create policy "player_of_the_month_insert_edit"
  on public.player_of_the_month for insert
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "player_of_the_month_update_edit" on public.player_of_the_month;
create policy "player_of_the_month_update_edit"
  on public.player_of_the_month for update
  using (public.can_mutate_team_data(team_id))
  with check (public.can_mutate_team_data(team_id));

drop policy if exists "player_of_the_month_delete_edit" on public.player_of_the_month;
create policy "player_of_the_month_delete_edit"
  on public.player_of_the_month for delete
  using (public.can_mutate_team_data(team_id));
