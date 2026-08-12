-- Guardians/players can read team fixtures and stats, but people_select only
-- allowed self + club staff. Names live on people, so squad/stats embeds came
-- back null (blank labels) and roster mapping threw. Allow people rows for
-- players/coaches on teams the viewer can already read, plus a guardian's
-- linked players. Also let team readers select coaches assigned to those teams.

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
        and public.is_club_staff(c.club_id)
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
    -- Guardian of this player (even if not yet on a team roster)
    or exists (
      select 1
      from public.players pl
      join public.player_guardians pg on pg.player_id = pl.id
      join public.guardians g on g.id = pg.guardian_id
      join public.people pe on pe.id = g.person_id
      where pl.person_id = p_person_id
        and pe.auth_user_id = auth.uid()
    )
    -- Player on a team the viewer can read
    or exists (
      select 1
      from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      join public.teams t on t.id = tp.team_id
      where pl.person_id = p_person_id
        and public.can_read_team_row(t.id, t.club_id)
    )
    -- Coach assigned to a team the viewer can read
    or exists (
      select 1
      from public.coaches c
      join public.team_coaches tc on tc.coach_id = c.id
      join public.teams t on t.id = tc.team_id
      where c.person_id = p_person_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

revoke all on function public.can_read_person(uuid) from public;
grant execute on function public.can_read_person(uuid) to authenticated;

drop policy if exists "people_select" on public.people;
create policy "people_select" on public.people for select to authenticated
  using (public.can_read_person(people.id));

drop policy if exists "coaches_select_staff" on public.coaches;
drop policy if exists "coaches_select" on public.coaches;
create policy "coaches_select" on public.coaches for select to authenticated
  using (
    public.is_club_staff(coaches.club_id)
    or public.person_auth_user_id(coaches.person_id) = auth.uid()
    or exists (
      select 1
      from public.team_coaches tc
      join public.teams t on t.id = tc.team_id
      where tc.coach_id = coaches.id
        and public.can_read_team_row(t.id, t.club_id)
    )
  );
