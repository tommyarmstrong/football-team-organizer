-- Guardian assistants can record match-day data (fixtures, squad, periods,
-- goals/assists, cards) but not player of the match.

create or replace function public.can_edit_match_day(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_management((select club_id from public.teams where id = p_team_id))
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id
        and tm.user_id = auth.uid()
        and tm.role::text in ('coach', 'management', 'guardian_assistant')
    );
$$;

revoke all on function public.can_edit_match_day(uuid) from public;
grant execute on function public.can_edit_match_day(uuid) to authenticated;

create or replace function public.can_edit_match_goals(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_edit_match_day(p_team_id);
$$;

-- Matches: create/update/delete fixtures (POTM columns are protected below).
drop policy if exists "matches_insert" on public.matches;
create policy "matches_insert" on public.matches for insert to authenticated
  with check (public.can_edit_match_day(team_id));

drop policy if exists "matches_update" on public.matches;
create policy "matches_update" on public.matches for update to authenticated
  using (public.can_edit_match_day(team_id))
  with check (public.can_edit_match_day(team_id));

drop policy if exists "matches_delete" on public.matches;
create policy "matches_delete" on public.matches for delete to authenticated
  using (public.can_edit_match_day(team_id));

-- Cards
drop policy if exists "cards_insert" on public.cards;
create policy "cards_insert" on public.cards for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "cards_update" on public.cards;
create policy "cards_update" on public.cards for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "cards_delete" on public.cards;
create policy "cards_delete" on public.cards for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

-- Match-day squad
drop policy if exists "match_players_insert" on public.match_players;
create policy "match_players_insert" on public.match_players for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "match_players_delete" on public.match_players;
create policy "match_players_delete" on public.match_players for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

-- Periods
drop policy if exists "match_periods_insert" on public.match_periods;
create policy "match_periods_insert" on public.match_periods for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "match_periods_update" on public.match_periods;
create policy "match_periods_update" on public.match_periods for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "match_periods_delete" on public.match_periods;
create policy "match_periods_delete" on public.match_periods for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_day(m.team_id)
    )
  );

-- Period starters
drop policy if exists "match_period_starters_insert" on public.match_period_starters;
create policy "match_period_starters_insert" on public.match_period_starters
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.match_periods mp
      join public.matches m on m.id = mp.match_id
      where mp.id = period_id and public.can_edit_match_day(m.team_id)
    )
  );

drop policy if exists "match_period_starters_delete" on public.match_period_starters;
create policy "match_period_starters_delete" on public.match_period_starters
  for delete to authenticated
  using (
    exists (
      select 1
      from public.match_periods mp
      join public.matches m on m.id = mp.match_id
      where mp.id = period_id and public.can_edit_match_day(m.team_id)
    )
  );

-- Player of the match stays coach/management-only, even though assistants
-- can update other match columns.
create or replace function public.prevent_unauthorized_player_of_the_match_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.player_of_the_match_id is distinct from old.player_of_the_match_id
    or new.players_player_of_the_match_id
      is distinct from old.players_player_of_the_match_id
  )
  and not (
    public.can_edit_team(new.team_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = new.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'management'
    )
  ) then
    raise exception 'Only coaches and management can set player of the match';
  end if;
  return new;
end;
$$;

drop trigger if exists matches_protect_player_of_the_match on public.matches;
create trigger matches_protect_player_of_the_match
before update on public.matches
for each row execute function public.prevent_unauthorized_player_of_the_match_change();
