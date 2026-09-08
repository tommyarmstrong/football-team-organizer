-- App login gate: only manager / coach / guardian (incl. assistant) may use the
-- app. A linked player role alone must not grant has_app_access (middleware
-- sends those sessions to /no-access). Roles remain additive: player + an
-- allowed role still has access.
--
-- Coach nuance unchanged: coaches/team_coaches profile rows alone do not grant
-- access — a team_members coach (or manager/guardian) row is still required.

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
        and tm.role in (
          'management',
          'coach',
          'guardian',
          'guardian_assistant'
        )
        and (p.id is null or p.account_status is distinct from 'disabled')
    )
    or exists (
      select 1
      from public.guardians g
      join public.people p on p.id = g.person_id
      where p.auth_user_id = auth.uid()
        and g.active_role
        and p.account_status is distinct from 'disabled'
    );
$$;
