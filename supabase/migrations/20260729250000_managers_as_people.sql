-- Club managers as club-level people (like coaches / guardians).
-- Linked login (optional user_id) grants club-wide management permissions.
-- Replaces club_members for the management role.

create table public.managers (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  second_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index managers_club_id_idx on public.managers (club_id);
create index managers_user_id_idx on public.managers (user_id);
create unique index managers_club_user_unique
  on public.managers (club_id, user_id)
  where user_id is not null;

create trigger managers_set_updated_at
before update on public.managers
for each row execute function public.set_updated_at();

-- Migrate existing club management memberships into people records.
insert into public.managers (club_id, user_id, first_name, second_name)
select
  cm.club_id,
  cm.user_id,
  'Club',
  'Manager'
from public.club_members cm
where cm.role = 'management';

-- Permission helpers now key off managers.user_id (before RLS policies).
create or replace function public.is_club_management(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.managers m
    where m.club_id = p_club_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_app_access()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.managers m where m.user_id = auth.uid())
    or exists (select 1 from public.team_members tm where tm.user_id = auth.uid())
    or exists (select 1 from public.guardians g where g.user_id = auth.uid())
    or exists (select 1 from public.players pl where pl.user_id = auth.uid());
$$;

create or replace function public.can_read_club(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (
      select 1 from public.managers m
      where m.club_id = p_club_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.teams t
      where t.club_id = p_club_id and public.can_read_team_row(t.id, t.club_id)
    );
$$;

create or replace function public.create_club_with_management(p_name text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.clubs (name) values (p_name) returning * into v_club;

  insert into public.managers (club_id, user_id, first_name, second_name)
  values (v_club.id, auth.uid(), 'Club', 'Manager');

  return v_club;
end;
$$;

alter table public.managers enable row level security;

create policy "managers_select" on public.managers for select to authenticated
  using (
    managers.user_id = auth.uid()
    or public.is_club_staff(managers.club_id)
  );

create policy "managers_insert_management" on public.managers for insert to authenticated
  with check (public.is_club_management(club_id));

create policy "managers_update_management" on public.managers for update to authenticated
  using (public.is_club_management(club_id))
  with check (public.is_club_management(club_id));

create policy "managers_delete_management" on public.managers for delete to authenticated
  using (public.is_club_management(club_id));

-- Drop club_members: managers people records own club-wide management now.
drop policy if exists "club_members_select" on public.club_members;
drop policy if exists "club_members_insert_management" on public.club_members;
drop policy if exists "club_members_update_management" on public.club_members;
drop policy if exists "club_members_delete_management" on public.club_members;
drop table if exists public.club_members;

drop type if exists public.club_role;
