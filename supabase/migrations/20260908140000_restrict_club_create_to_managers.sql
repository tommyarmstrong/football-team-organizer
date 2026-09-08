-- Invite-only access: only existing club managers may create additional clubs.
-- Stops any authenticated Google/password user from bootstrapping a new club
-- (and inventing a people + managers row) via create_club_with_management.

create or replace function public.create_club_with_management(p_name text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
  v_person_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_manage_any_club() then
    raise exception 'Only club management can create clubs';
  end if;

  select id into v_person_id
  from public.people
  where auth_user_id = auth.uid()
    and account_status is distinct from 'disabled'
  limit 1;

  if v_person_id is null then
    raise exception 'No person linked to this account';
  end if;

  insert into public.clubs (name) values (p_name) returning * into v_club;

  insert into public.managers (club_id, person_id)
  values (v_club.id, v_person_id);

  return v_club;
end;
$$;
