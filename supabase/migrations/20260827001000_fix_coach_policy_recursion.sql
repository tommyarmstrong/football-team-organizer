-- team_coaches_select looked up coaches, and coaches_select looks up
-- team_coaches. That loop raises "infinite recursion detected in policy
-- for relation coaches" when a guardian opens People.
--
-- Allow club guardians to read team_coaches via the team's club id instead,
-- using a security-definer helper so teams RLS does not hide other squads.

create or replace function public.team_club_id(p_team_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.teams where id = p_team_id;
$$;

revoke all on function public.team_club_id(uuid) from public;
grant execute on function public.team_club_id(uuid) to authenticated;

drop policy if exists "team_coaches_select" on public.team_coaches;
create policy "team_coaches_select" on public.team_coaches for select to authenticated
  using (
    public.can_read_team(team_id)
    or public.is_club_guardian(public.team_club_id(team_id))
  );
