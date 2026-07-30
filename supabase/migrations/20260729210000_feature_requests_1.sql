-- Feature requests batch 1: teams, roles, players, guardians, coaches, matches.

-- ---------------------------------------------------------------------------
-- Teams: home venue, training fields, drop head_coach_name
-- ---------------------------------------------------------------------------

alter table public.teams rename column home_ground to home_venue;
alter table public.teams alter column home_venue drop not null;

alter table public.teams
  add column training_venue text,
  add column training_days text[];

-- Normalize existing head-coach role labels before dropping the free-text column.
update public.team_coaches
set role = 'Head Coach'
where lower(role) in ('head coach', 'headcoach');

alter table public.teams drop column head_coach_name;

-- ---------------------------------------------------------------------------
-- Team role: guardian_assistant + goals write helper
-- ---------------------------------------------------------------------------

alter type public.team_role add value if not exists 'guardian_assistant';

create or replace function public.can_edit_match_goals(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_management((select club_id from public.teams where id = p_team_id))
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id
        and tm.user_id = auth.uid()
        and tm.role::text in ('coach', 'guardian_assistant')
    );
$$;

revoke all on function public.can_edit_match_goals(uuid) from public;
grant execute on function public.can_edit_match_goals(uuid) to authenticated;

drop policy if exists "goals_insert" on public.goals;
create policy "goals_insert" on public.goals for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_goals(m.team_id)
    )
  );

drop policy if exists "goals_update" on public.goals;
create policy "goals_update" on public.goals for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_goals(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_goals(m.team_id)
    )
  );

drop policy if exists "goals_delete" on public.goals;
create policy "goals_delete" on public.goals for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_match_goals(m.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Players / contacts
-- ---------------------------------------------------------------------------

alter table public.players add column school text;

alter table public.player_contacts
  add column emergency_guardian_id uuid references public.guardians (id) on delete set null;

alter table public.player_contacts
  drop column emergency_contact_name,
  drop column emergency_contact_phone;

-- ---------------------------------------------------------------------------
-- Guardian relationship: dad/mum → parent
-- ---------------------------------------------------------------------------

alter table public.player_guardians
  alter column relationship type text using relationship::text;

update public.player_guardians
set relationship = 'parent'
where relationship in ('dad', 'mum');

drop type public.guardian_relationship;

create type public.guardian_relationship as enum (
  'parent',
  'guardian',
  'football_contact',
  'other'
);

alter table public.player_guardians
  alter column relationship type public.guardian_relationship
  using relationship::public.guardian_relationship;

-- ---------------------------------------------------------------------------
-- Coaches: DOB + development objectives
-- ---------------------------------------------------------------------------

alter table public.coaches add column date_of_birth date;

create table public.coach_development_objectives (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coach_development_objectives_coach_id_idx
  on public.coach_development_objectives (coach_id);

create trigger coach_development_objectives_set_updated_at
before update on public.coach_development_objectives
for each row execute function public.set_updated_at();

alter table public.coach_development_objectives enable row level security;

create policy "coach_objectives_select" on public.coach_development_objectives
  for select to authenticated
  using (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id and public.is_club_staff(c.club_id)
    )
  );

create policy "coach_objectives_insert" on public.coach_development_objectives
  for insert to authenticated
  with check (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id and public.is_club_staff(c.club_id)
    )
  );

create policy "coach_objectives_update" on public.coach_development_objectives
  for update to authenticated
  using (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id and public.is_club_staff(c.club_id)
    )
  )
  with check (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id and public.is_club_staff(c.club_id)
    )
  );

create policy "coach_objectives_delete" on public.coach_development_objectives
  for delete to authenticated
  using (
    exists (
      select 1 from public.coaches c
      where c.id = coach_id and public.is_club_staff(c.club_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Matches: in_progress, club notes, player's POTM
-- ---------------------------------------------------------------------------

alter type public.match_status add value if not exists 'in_progress';

alter table public.matches
  add column club_notes text,
  add column players_player_of_the_match_id uuid references public.players (id) on delete set null;
