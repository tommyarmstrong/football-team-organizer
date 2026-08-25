-- Squashed baseline schema for Football Team Organizer.
-- Apply this file once on an empty database (SQL Editor or `supabase db push`).
-- Do not run on a project that already applied the previous migration chain.

-- =============================================================================
-- 20260724170000_init_schema.sql
-- =============================================================================
-- Stage 4: core schema for Football Team Organizer
-- Multi-team-ready via team_id; MVP uses a single team + coach/admin membership.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.team_gender as enum ('boys', 'girls', 'mixed');

create type public.competition_kind as enum (
  'league',
  'cup',
  'friendly',
  'tournament',
  'other'
);

create type public.match_venue as enum ('home', 'away', 'neutral');

create type public.match_status as enum (
  'scheduled',
  'played',
  'postponed',
  'cancelled'
);

create type public.team_member_role as enum ('coach', 'admin');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club text not null,
  name text not null,
  age_group text not null,
  gender public.team_gender not null,
  home_ground text not null,
  head_coach_name text not null,
  season_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger teams_set_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  kind public.competition_kind,
  created_at timestamptz not null default timezone('utc', now())
);

create index competitions_team_id_idx on public.competitions (team_id);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  shirt_number integer,
  position text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint players_shirt_number_positive check (
    shirt_number is null or shirt_number > 0
  )
);

create unique index players_team_shirt_number_uidx
  on public.players (team_id, shirt_number)
  where shirt_number is not null;

create index players_team_id_idx on public.players (team_id);

create trigger players_set_updated_at
before update on public.players
for each row
execute function public.set_updated_at();

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent_name text not null,
  date date not null,
  kickoff_time time,
  venue public.match_venue not null,
  competition_id uuid references public.competitions (id) on delete set null,
  status public.match_status not null default 'scheduled',
  goals_for integer,
  goals_against integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matches_goals_for_non_negative check (
    goals_for is null or goals_for >= 0
  ),
  constraint matches_goals_against_non_negative check (
    goals_against is null or goals_against >= 0
  )
);

create index matches_team_id_idx on public.matches (team_id);
create index matches_competition_id_idx on public.matches (competition_id);
create index matches_date_idx on public.matches (date);

create trigger matches_set_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

-- Goals scored by our squad only (no opposition scorers).
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  assist_player_id uuid references public.players (id) on delete set null,
  period text,
  minute integer,
  is_penalty boolean not null default false,
  is_freekick boolean not null default false,
  from_setpiece boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint goals_minute_range check (
    minute is null or (minute >= 0 and minute <= 120)
  ),
  constraint goals_assist_not_scorer check (
    assist_player_id is null or assist_player_id <> player_id
  )
);

create index goals_match_id_idx on public.goals (match_id);
create index goals_player_id_idx on public.goals (player_id);
create index goals_assist_player_id_idx on public.goals (assist_player_id);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_member_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint team_members_team_user_unique unique (team_id, user_id)
);

create index team_members_user_id_idx on public.team_members (user_id);
create index team_members_team_id_idx on public.team_members (team_id);

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER avoids RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
      and tm.role in ('coach', 'admin')
  );
$$;

revoke all on function public.is_team_member(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.teams enable row level security;
alter table public.competitions enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.goals enable row level security;
alter table public.team_members enable row level security;

-- teams
create policy "teams_select_member"
  on public.teams for select to authenticated
  using (public.is_team_member(id));

create policy "teams_insert_member"
  on public.teams for insert to authenticated
  with check (public.is_team_member(id));

create policy "teams_update_member"
  on public.teams for update to authenticated
  using (public.is_team_member(id))
  with check (public.is_team_member(id));

create policy "teams_delete_member"
  on public.teams for delete to authenticated
  using (public.is_team_member(id));

-- competitions
create policy "competitions_select_member"
  on public.competitions for select to authenticated
  using (public.is_team_member(team_id));

create policy "competitions_insert_member"
  on public.competitions for insert to authenticated
  with check (public.is_team_member(team_id));

create policy "competitions_update_member"
  on public.competitions for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "competitions_delete_member"
  on public.competitions for delete to authenticated
  using (public.is_team_member(team_id));

-- players
create policy "players_select_member"
  on public.players for select to authenticated
  using (public.is_team_member(team_id));

create policy "players_insert_member"
  on public.players for insert to authenticated
  with check (public.is_team_member(team_id));

create policy "players_update_member"
  on public.players for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "players_delete_member"
  on public.players for delete to authenticated
  using (public.is_team_member(team_id));

-- matches
create policy "matches_select_member"
  on public.matches for select to authenticated
  using (public.is_team_member(team_id));

create policy "matches_insert_member"
  on public.matches for insert to authenticated
  with check (public.is_team_member(team_id));

create policy "matches_update_member"
  on public.matches for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "matches_delete_member"
  on public.matches for delete to authenticated
  using (public.is_team_member(team_id));

-- goals (via match ownership)
create policy "goals_select_member"
  on public.goals for select to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_team_member(m.team_id)
    )
  );

create policy "goals_insert_member"
  on public.goals for insert to authenticated
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_team_member(m.team_id)
    )
  );

create policy "goals_update_member"
  on public.goals for update to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_team_member(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_team_member(m.team_id)
    )
  );

create policy "goals_delete_member"
  on public.goals for delete to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_team_member(m.team_id)
    )
  );

-- team_members: users can always read their own row (middleware membership check).
-- Managing members for a team requires existing membership (first row via seed / service role).
create policy "team_members_select_own_or_team"
  on public.team_members for select to authenticated
  using (user_id = auth.uid() or public.is_team_member(team_id));

create policy "team_members_insert_member"
  on public.team_members for insert to authenticated
  with check (public.is_team_member(team_id));

create policy "team_members_update_member"
  on public.team_members for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "team_members_delete_member"
  on public.team_members for delete to authenticated
  using (public.is_team_member(team_id));


-- =============================================================================
-- 20260724190000_add_coaches.sql
-- =============================================================================
-- Coaches roster for a team (distinct from team_members auth roles).

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null,
  second_name text not null,
  joined_date date not null,
  dbs_checked boolean not null default false,
  fa_level_1 boolean not null default false,
  fa_level_2 boolean not null default false,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index coaches_team_id_idx on public.coaches (team_id);

create trigger coaches_set_updated_at
before update on public.coaches
for each row
execute function public.set_updated_at();

alter table public.coaches enable row level security;

create policy "coaches_select_member"
  on public.coaches for select to authenticated
  using (public.is_team_member(team_id));

create policy "coaches_insert_member"
  on public.coaches for insert to authenticated
  with check (public.is_team_member(team_id));

create policy "coaches_update_member"
  on public.coaches for update to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "coaches_delete_member"
  on public.coaches for delete to authenticated
  using (public.is_team_member(team_id));


-- =============================================================================
-- 20260724192000_coaches_biography.sql
-- =============================================================================
-- Optional biography for coaching staff profiles.

alter table public.coaches
  add column biography text;


-- =============================================================================
-- 20260724200000_club_platform.sql
-- =============================================================================
-- Club platform: a club owns many teams. Players and coaches are club-level
-- people assigned to zero/many teams via junction tables. Roles: club-level
-- management, team-level coach/parent/player, plus parent->player guardian links
-- and per-player sensitive contact details. Matches, competitions, goals and
-- player-of-the-match stay team-owned.
--
-- Destructive rebuild of the domain schema. Acceptable: dev/test data only.

-- ---------------------------------------------------------------------------
-- Tear down the previous single-team schema
-- ---------------------------------------------------------------------------
drop table if exists public.goals cascade;
drop table if exists public.matches cascade;
drop table if exists public.competitions cascade;
drop table if exists public.coaches cascade;
drop table if exists public.players cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;

drop function if exists public.is_team_member(uuid) cascade;

drop type if exists public.team_member_role cascade;
drop type if exists public.team_gender cascade;
drop type if exists public.competition_kind cascade;
drop type if exists public.match_venue cascade;
drop type if exists public.match_status cascade;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.team_gender as enum ('boys', 'girls', 'mixed');

create type public.competition_kind as enum (
  'league',
  'cup',
  'friendly',
  'tournament',
  'other'
);

create type public.match_venue as enum ('home', 'away', 'neutral');

create type public.match_status as enum (
  'scheduled',
  'played',
  'postponed',
  'cancelled'
);

-- Club-wide administrators.
create type public.club_role as enum ('management');

-- Team-scoped participants. Coaches edit their team; parents/players read only.
create type public.team_role as enum ('coach', 'parent', 'player');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.club_role not null default 'management',
  created_at timestamptz not null default timezone('utc', now()),
  constraint club_members_club_user_unique unique (club_id, user_id)
);

create index club_members_user_id_idx on public.club_members (user_id);
create index club_members_club_id_idx on public.club_members (club_id);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  age_group text not null,
  gender public.team_gender not null,
  home_ground text not null,
  head_coach_name text not null,
  season_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index teams_club_id_idx on public.teams (club_id);

create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.team_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint team_members_team_user_unique unique (team_id, user_id)
);

create index team_members_user_id_idx on public.team_members (user_id);
create index team_members_team_id_idx on public.team_members (team_id);

-- Club-level people. Optional user_id links a player to an auth account.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  position text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index players_club_id_idx on public.players (club_id);
create index players_user_id_idx on public.players (user_id);

create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

-- Sensitive contact details, kept in a separate table with stricter access.
create table public.player_contacts (
  player_id uuid primary key references public.players (id) on delete cascade,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger player_contacts_set_updated_at
before update on public.player_contacts
for each row execute function public.set_updated_at();

-- Parent / guardian links to a player.
create table public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  relationship text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint player_guardians_unique unique (player_id, user_id)
);

create index player_guardians_user_id_idx on public.player_guardians (user_id);
create index player_guardians_player_id_idx on public.player_guardians (player_id);

-- Squad membership: which players are on which team, with per-team shirt/status.
create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  shirt_number integer,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint team_players_team_player_unique unique (team_id, player_id),
  constraint team_players_shirt_number_positive check (
    shirt_number is null or shirt_number > 0
  )
);

create unique index team_players_shirt_number_uidx
  on public.team_players (team_id, shirt_number)
  where shirt_number is not null;

create index team_players_team_id_idx on public.team_players (team_id);
create index team_players_player_id_idx on public.team_players (player_id);

create trigger team_players_set_updated_at
before update on public.team_players
for each row execute function public.set_updated_at();

-- Club-level coaching staff records (distinct from auth team_members).
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  first_name text not null,
  second_name text not null,
  joined_date date not null,
  dbs_checked boolean not null default false,
  fa_level_1 boolean not null default false,
  fa_level_2 boolean not null default false,
  phone text,
  email text,
  notes text,
  biography text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index coaches_club_id_idx on public.coaches (club_id);

create trigger coaches_set_updated_at
before update on public.coaches
for each row execute function public.set_updated_at();

create table public.team_coaches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete cascade,
  role text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint team_coaches_team_coach_unique unique (team_id, coach_id)
);

create index team_coaches_team_id_idx on public.team_coaches (team_id);
create index team_coaches_coach_id_idx on public.team_coaches (coach_id);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  kind public.competition_kind,
  created_at timestamptz not null default timezone('utc', now())
);

create index competitions_team_id_idx on public.competitions (team_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent_name text not null,
  date date not null,
  kickoff_time time,
  venue public.match_venue not null,
  competition_id uuid references public.competitions (id) on delete set null,
  player_of_the_match_id uuid references public.players (id) on delete set null,
  status public.match_status not null default 'scheduled',
  goals_for integer,
  goals_against integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matches_goals_for_non_negative check (
    goals_for is null or goals_for >= 0
  ),
  constraint matches_goals_against_non_negative check (
    goals_against is null or goals_against >= 0
  )
);

create index matches_team_id_idx on public.matches (team_id);
create index matches_competition_id_idx on public.matches (competition_id);
create index matches_date_idx on public.matches (date);

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

-- Goals scored by our squad only (no opposition scorers).
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  assist_player_id uuid references public.players (id) on delete set null,
  period text,
  minute integer,
  is_penalty boolean not null default false,
  is_freekick boolean not null default false,
  from_setpiece boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint goals_minute_range check (
    minute is null or (minute >= 0 and minute <= 120)
  ),
  constraint goals_assist_not_scorer check (
    assist_player_id is null or assist_player_id <> player_id
  )
);

create index goals_match_id_idx on public.goals (match_id);
create index goals_player_id_idx on public.goals (player_id);
create index goals_assist_player_id_idx on public.goals (assist_player_id);

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_club_management(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.club_members cm
    where cm.club_id = p_club_id
      and cm.user_id = auth.uid()
      and cm.role = 'management'
  );
$$;

create or replace function public.is_club_staff(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_club_management(p_club_id)
    or exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where t.club_id = p_club_id
        and tm.user_id = auth.uid()
        and tm.role = 'coach'
    );
$$;

create or replace function public.can_edit_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_management((select club_id from public.teams where id = p_team_id))
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id
        and tm.user_id = auth.uid()
        and tm.role = 'coach'
    );
$$;

create or replace function public.can_read_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    -- club management, or any coach in the same club (staff read all club teams)
    public.is_club_staff((select club_id from public.teams where id = p_team_id))
    -- direct team member (parent/player)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id and tm.user_id = auth.uid()
    )
    -- guardian of a player on this team
    or exists (
      select 1 from public.player_guardians pg
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = p_team_id and pg.user_id = auth.uid()
    )
    -- player themselves on this team
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = p_team_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.can_edit_player(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_management((select club_id from public.players where id = p_player_id))
    or exists (
      select 1 from public.team_players tp
      where tp.player_id = p_player_id and public.can_edit_team(tp.team_id)
    );
$$;

create or replace function public.can_read_player(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff((select club_id from public.players where id = p_player_id))
    or exists (
      select 1 from public.team_players tp
      where tp.player_id = p_player_id and public.can_read_team(tp.team_id)
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = p_player_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = p_player_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.can_view_player_contact(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.can_edit_player(p_player_id)
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = p_player_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = p_player_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.has_app_access()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.club_members cm where cm.user_id = auth.uid())
    or exists (select 1 from public.team_members tm where tm.user_id = auth.uid())
    or exists (select 1 from public.player_guardians pg where pg.user_id = auth.uid())
    or exists (select 1 from public.players pl where pl.user_id = auth.uid());
$$;

-- Bootstrap: create a club and make the caller its first management member.
create or replace function public.create_club_with_management(p_name text)
returns public.clubs
language plpgsql volatile security definer set search_path = public as $$
declare
  v_club public.clubs;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.clubs (name) values (p_name) returning * into v_club;
  insert into public.club_members (club_id, user_id, role)
  values (v_club.id, auth.uid(), 'management');

  return v_club;
end;
$$;

revoke all on function public.is_club_management(uuid) from public;
revoke all on function public.is_club_staff(uuid) from public;
revoke all on function public.can_edit_team(uuid) from public;
revoke all on function public.can_read_team(uuid) from public;
revoke all on function public.can_edit_player(uuid) from public;
revoke all on function public.can_read_player(uuid) from public;
revoke all on function public.can_view_player_contact(uuid) from public;
revoke all on function public.has_app_access() from public;
revoke all on function public.create_club_with_management(text) from public;

grant execute on function public.is_club_management(uuid) to authenticated;
grant execute on function public.is_club_staff(uuid) to authenticated;
grant execute on function public.can_edit_team(uuid) to authenticated;
grant execute on function public.can_read_team(uuid) to authenticated;
grant execute on function public.can_edit_player(uuid) to authenticated;
grant execute on function public.can_read_player(uuid) to authenticated;
grant execute on function public.can_view_player_contact(uuid) to authenticated;
grant execute on function public.has_app_access() to authenticated;
grant execute on function public.create_club_with_management(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.player_contacts enable row level security;
alter table public.player_guardians enable row level security;
alter table public.team_players enable row level security;
alter table public.coaches enable row level security;
alter table public.team_coaches enable row level security;
alter table public.competitions enable row level security;
alter table public.matches enable row level security;
alter table public.goals enable row level security;

-- clubs
create policy "clubs_select" on public.clubs for select to authenticated
  using (
    exists (select 1 from public.club_members cm where cm.club_id = id and cm.user_id = auth.uid())
    or exists (select 1 from public.teams t where t.club_id = id and public.can_read_team(t.id))
  );
create policy "clubs_update_management" on public.clubs for update to authenticated
  using (public.is_club_management(id)) with check (public.is_club_management(id));
create policy "clubs_delete_management" on public.clubs for delete to authenticated
  using (public.is_club_management(id));

-- club_members
create policy "club_members_select" on public.club_members for select to authenticated
  using (user_id = auth.uid() or public.is_club_management(club_id));
create policy "club_members_insert_management" on public.club_members for insert to authenticated
  with check (public.is_club_management(club_id));
create policy "club_members_update_management" on public.club_members for update to authenticated
  using (public.is_club_management(club_id)) with check (public.is_club_management(club_id));
create policy "club_members_delete_management" on public.club_members for delete to authenticated
  using (public.is_club_management(club_id));

-- teams
create policy "teams_select" on public.teams for select to authenticated
  using (public.can_read_team(id));
create policy "teams_insert_management" on public.teams for insert to authenticated
  with check (public.is_club_management(club_id));
create policy "teams_update" on public.teams for update to authenticated
  using (public.can_edit_team(id)) with check (public.can_edit_team(id));
create policy "teams_delete_management" on public.teams for delete to authenticated
  using (public.is_club_management(club_id));

-- team_members
create policy "team_members_select" on public.team_members for select to authenticated
  using (user_id = auth.uid() or public.can_read_team(team_id));
create policy "team_members_insert" on public.team_members for insert to authenticated
  with check (public.can_edit_team(team_id));
create policy "team_members_update" on public.team_members for update to authenticated
  using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "team_members_delete" on public.team_members for delete to authenticated
  using (public.can_edit_team(team_id));

-- players
create policy "players_select" on public.players for select to authenticated
  using (public.can_read_player(id));
create policy "players_insert_staff" on public.players for insert to authenticated
  with check (public.is_club_staff(club_id));
create policy "players_update" on public.players for update to authenticated
  using (public.can_edit_player(id)) with check (public.can_edit_player(id));
create policy "players_delete_management" on public.players for delete to authenticated
  using (public.is_club_management(club_id));

-- player_contacts
create policy "player_contacts_select" on public.player_contacts for select to authenticated
  using (public.can_view_player_contact(player_id));
create policy "player_contacts_insert" on public.player_contacts for insert to authenticated
  with check (public.can_view_player_contact(player_id));
create policy "player_contacts_update" on public.player_contacts for update to authenticated
  using (public.can_view_player_contact(player_id)) with check (public.can_view_player_contact(player_id));
create policy "player_contacts_delete" on public.player_contacts for delete to authenticated
  using (public.can_view_player_contact(player_id));

-- player_guardians
create policy "player_guardians_select" on public.player_guardians for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_club_staff((select club_id from public.players where id = player_id))
  );
create policy "player_guardians_insert_staff" on public.player_guardians for insert to authenticated
  with check (public.is_club_staff((select club_id from public.players where id = player_id)));
create policy "player_guardians_update_staff" on public.player_guardians for update to authenticated
  using (public.is_club_staff((select club_id from public.players where id = player_id)))
  with check (public.is_club_staff((select club_id from public.players where id = player_id)));
create policy "player_guardians_delete_staff" on public.player_guardians for delete to authenticated
  using (public.is_club_staff((select club_id from public.players where id = player_id)));

-- team_players
create policy "team_players_select" on public.team_players for select to authenticated
  using (public.can_read_team(team_id));
create policy "team_players_insert" on public.team_players for insert to authenticated
  with check (public.can_edit_team(team_id));
create policy "team_players_update" on public.team_players for update to authenticated
  using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "team_players_delete" on public.team_players for delete to authenticated
  using (public.can_edit_team(team_id));

-- coaches
create policy "coaches_select_staff" on public.coaches for select to authenticated
  using (public.is_club_staff(club_id));
create policy "coaches_insert_staff" on public.coaches for insert to authenticated
  with check (public.is_club_staff(club_id));
create policy "coaches_update_staff" on public.coaches for update to authenticated
  using (public.is_club_staff(club_id)) with check (public.is_club_staff(club_id));
create policy "coaches_delete_staff" on public.coaches for delete to authenticated
  using (public.is_club_staff(club_id));

-- team_coaches
create policy "team_coaches_select" on public.team_coaches for select to authenticated
  using (public.can_read_team(team_id));
create policy "team_coaches_insert" on public.team_coaches for insert to authenticated
  with check (public.can_edit_team(team_id));
create policy "team_coaches_update" on public.team_coaches for update to authenticated
  using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "team_coaches_delete" on public.team_coaches for delete to authenticated
  using (public.can_edit_team(team_id));

-- competitions
create policy "competitions_select" on public.competitions for select to authenticated
  using (public.can_read_team(team_id));
create policy "competitions_insert" on public.competitions for insert to authenticated
  with check (public.can_edit_team(team_id));
create policy "competitions_update" on public.competitions for update to authenticated
  using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "competitions_delete" on public.competitions for delete to authenticated
  using (public.can_edit_team(team_id));

-- matches
create policy "matches_select" on public.matches for select to authenticated
  using (public.can_read_team(team_id));
create policy "matches_insert" on public.matches for insert to authenticated
  with check (public.can_edit_team(team_id));
create policy "matches_update" on public.matches for update to authenticated
  using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "matches_delete" on public.matches for delete to authenticated
  using (public.can_edit_team(team_id));

-- goals (via match ownership)
create policy "goals_select" on public.goals for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and public.can_read_team(m.team_id)));
create policy "goals_insert" on public.goals for insert to authenticated
  with check (exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id)));
create policy "goals_update" on public.goals for update to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id)))
  with check (exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id)));
create policy "goals_delete" on public.goals for delete to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id)));


-- =============================================================================
-- 20260724210000_fix_teams_select_rls.sql
-- =============================================================================
-- Fix teams SELECT RLS so INSERT...RETURNING works for club management.
--
-- teams_select previously used can_read_team(id), which re-queries public.teams
-- inside a helper. During INSERT...RETURNING that lookup cannot see the new row
-- yet, so club_id resolves to null, the SELECT policy fails, and PostgREST
-- reports: new row violates row-level security policy for table "teams".
--
-- Use the row's club_id (and id) columns directly instead.

drop policy if exists "teams_select" on public.teams;

create policy "teams_select" on public.teams for select to authenticated
  using (
    public.is_club_staff(teams.club_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = teams.id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = teams.id and pl.user_id = auth.uid()
    )
  );


-- =============================================================================
-- 20260724220000_fix_clubs_players_select_rls.sql
-- =============================================================================
-- Fix clubs / players SELECT RLS so staff can reliably read clubs and
-- INSERT...RETURNING on players works the same way as the teams fix.
--
-- clubs_select previously joined club_members under that table's RLS, which
-- could leave getPrimaryClub() empty for management users who already have
-- visible teams. Use SECURITY DEFINER helpers instead.
--
-- players_select previously called can_read_player(id), which re-queries
-- public.players inside a helper. During INSERT...RETURNING that lookup can
-- miss the new row. Use the row's club_id / id columns directly.

drop policy if exists "clubs_select" on public.clubs;

create policy "clubs_select" on public.clubs for select to authenticated
  using (
    public.is_club_staff(clubs.id)
    or exists (
      select 1 from public.teams t
      where t.club_id = clubs.id and public.can_read_team(t.id)
    )
  );

drop policy if exists "players_select" on public.players;

create policy "players_select" on public.players for select to authenticated
  using (
    public.is_club_staff(players.club_id)
    or exists (
      select 1 from public.team_players tp
      where tp.player_id = players.id and public.can_read_team(tp.team_id)
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = players.id and pg.user_id = auth.uid()
    )
    or players.user_id = auth.uid()
  );


-- =============================================================================
-- 20260724230000_fix_rls_recursion.sql
-- =============================================================================
-- Fix "infinite recursion detected in policy for relation player_guardians".
--
-- Policy expressions run as the invoking user, so any table referenced inside a
-- policy has its own RLS applied. That created a cycle:
--
--   teams_select / players_select  -> player_guardians
--   player_guardians_select        -> (select club_id from players ...)
--   players_select                 -> player_guardians ...
--
-- Every cross-table check now goes through a SECURITY DEFINER helper (which
-- bypasses RLS), and the helpers take the row's columns as arguments so
-- INSERT ... RETURNING never has to re-read the not-yet-visible new row.

create or replace function public.can_read_team_row(p_team_id uuid, p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = p_team_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = p_team_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = p_team_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.can_read_player_row(
  p_player_id uuid,
  p_club_id uuid,
  p_user_id uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or p_user_id = auth.uid()
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = p_player_id and pg.user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = p_player_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

-- Keep the single-argument helper (used by team-scoped tables) delegating to the
-- row variant so read rules live in one place.
create or replace function public.can_read_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select public.can_read_team_row(t.id, t.club_id) from public.teams t where t.id = p_team_id),
    false
  );
$$;

create or replace function public.can_read_club(p_club_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or exists (select 1 from public.club_members cm where cm.club_id = p_club_id and cm.user_id = auth.uid())
    or exists (
      select 1 from public.teams t
      where t.club_id = p_club_id and public.can_read_team_row(t.id, t.club_id)
    );
$$;

create or replace function public.player_club_id(p_player_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.players where id = p_player_id;
$$;

revoke all on function public.can_read_team_row(uuid, uuid) from public;
revoke all on function public.can_read_player_row(uuid, uuid, uuid) from public;
revoke all on function public.can_read_club(uuid) from public;
revoke all on function public.player_club_id(uuid) from public;

grant execute on function public.can_read_team_row(uuid, uuid) to authenticated;
grant execute on function public.can_read_player_row(uuid, uuid, uuid) to authenticated;
grant execute on function public.can_read_club(uuid) to authenticated;
grant execute on function public.player_club_id(uuid) to authenticated;

-- clubs
drop policy if exists "clubs_select" on public.clubs;
create policy "clubs_select" on public.clubs for select to authenticated
  using (public.can_read_club(clubs.id));

-- teams
drop policy if exists "teams_select" on public.teams;
create policy "teams_select" on public.teams for select to authenticated
  using (public.can_read_team_row(teams.id, teams.club_id));

-- players
drop policy if exists "players_select" on public.players;
create policy "players_select" on public.players for select to authenticated
  using (public.can_read_player_row(players.id, players.club_id, players.user_id));

-- player_guardians: reach players through a definer helper, not a subquery.
drop policy if exists "player_guardians_select" on public.player_guardians;
create policy "player_guardians_select" on public.player_guardians for select to authenticated
  using (
    player_guardians.user_id = auth.uid()
    or public.is_club_staff(public.player_club_id(player_guardians.player_id))
  );

drop policy if exists "player_guardians_insert_staff" on public.player_guardians;
create policy "player_guardians_insert_staff" on public.player_guardians for insert to authenticated
  with check (public.is_club_staff(public.player_club_id(player_guardians.player_id)));

drop policy if exists "player_guardians_update_staff" on public.player_guardians;
create policy "player_guardians_update_staff" on public.player_guardians for update to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)))
  with check (public.is_club_staff(public.player_club_id(player_guardians.player_id)));

drop policy if exists "player_guardians_delete_staff" on public.player_guardians;
create policy "player_guardians_delete_staff" on public.player_guardians for delete to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)));


-- =============================================================================
-- 20260729180000_rename_team_role_parent_to_guardian.sql
-- =============================================================================
-- Rename team_role enum value parent → guardian for consistent terminology.

alter type public.team_role rename value 'parent' to 'guardian';


-- =============================================================================
-- 20260729190000_guardians_as_people.sql
-- =============================================================================
-- Guardians become club-level people (like coaches). player_guardians becomes
-- the junction linking zero/many players to a guardian, with per-link
-- relationship and legal_guardian flags.
-- Auth access for a signed-in guardian uses optional guardians.user_id.

create type public.guardian_relationship as enum (
  'dad',
  'mum',
  'guardian',
  'football_contact',
  'other'
);

create table public.guardians (
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

create index guardians_club_id_idx on public.guardians (club_id);
create index guardians_user_id_idx on public.guardians (user_id);

create trigger guardians_set_updated_at
before update on public.guardians
for each row execute function public.set_updated_at();

-- Drop the old auth-user ↔ player link table and recreate as guardian ↔ player.
drop table if exists public.player_guardians cascade;

create table public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  guardian_id uuid not null references public.guardians (id) on delete cascade,
  relationship public.guardian_relationship not null,
  legal_guardian boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint player_guardians_unique unique (player_id, guardian_id)
);

create index player_guardians_guardian_id_idx on public.player_guardians (guardian_id);
create index player_guardians_player_id_idx on public.player_guardians (player_id);

alter table public.guardians enable row level security;
alter table public.player_guardians enable row level security;

-- ---------------------------------------------------------------------------
-- Auth helpers: guardian access is via guardians.user_id → player_guardians
-- ---------------------------------------------------------------------------
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
      join public.team_players tp on tp.player_id = pg.player_id
      where tp.team_id = p_team_id and g.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      join public.team_players tp on tp.player_id = pl.id
      where tp.team_id = p_team_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.can_read_player_row(
  p_player_id uuid,
  p_club_id uuid,
  p_user_id uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or p_user_id = auth.uid()
    or exists (
      select 1
      from public.player_guardians pg
      join public.guardians g on g.id = pg.guardian_id
      where pg.player_id = p_player_id and g.user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = p_player_id
        and public.can_read_team_row(t.id, t.club_id)
    );
$$;

create or replace function public.can_read_player(p_player_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select public.can_read_player_row(pl.id, pl.club_id, pl.user_id)
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
      where pg.player_id = p_player_id and g.user_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = p_player_id and pl.user_id = auth.uid()
    );
$$;

create or replace function public.has_app_access()
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.club_members cm where cm.user_id = auth.uid())
    or exists (select 1 from public.team_members tm where tm.user_id = auth.uid())
    or exists (select 1 from public.guardians g where g.user_id = auth.uid())
    or exists (select 1 from public.players pl where pl.user_id = auth.uid());
$$;

create or replace function public.guardian_club_id(p_guardian_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.guardians where id = p_guardian_id;
$$;

revoke all on function public.guardian_club_id(uuid) from public;
grant execute on function public.guardian_club_id(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: guardians
-- ---------------------------------------------------------------------------
create policy "guardians_select" on public.guardians for select to authenticated
  using (
    guardians.user_id = auth.uid()
    or public.is_club_staff(guardians.club_id)
  );

create policy "guardians_insert_staff" on public.guardians for insert to authenticated
  with check (public.is_club_staff(guardians.club_id));

create policy "guardians_update_staff" on public.guardians for update to authenticated
  using (public.is_club_staff(guardians.club_id))
  with check (public.is_club_staff(guardians.club_id));

create policy "guardians_delete_staff" on public.guardians for delete to authenticated
  using (public.is_club_staff(guardians.club_id));

-- ---------------------------------------------------------------------------
-- RLS: player_guardians
-- ---------------------------------------------------------------------------
create policy "player_guardians_select" on public.player_guardians for select to authenticated
  using (
    exists (
      select 1 from public.guardians g
      where g.id = player_guardians.guardian_id and g.user_id = auth.uid()
    )
    or public.is_club_staff(public.player_club_id(player_guardians.player_id))
  );

create policy "player_guardians_insert_staff" on public.player_guardians for insert to authenticated
  with check (
    public.is_club_staff(public.player_club_id(player_guardians.player_id))
    and public.guardian_club_id(player_guardians.guardian_id)
      = public.player_club_id(player_guardians.player_id)
  );

create policy "player_guardians_update_staff" on public.player_guardians for update to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)))
  with check (
    public.is_club_staff(public.player_club_id(player_guardians.player_id))
    and public.guardian_club_id(player_guardians.guardian_id)
      = public.player_club_id(player_guardians.player_id)
  );

create policy "player_guardians_delete_staff" on public.player_guardians for delete to authenticated
  using (public.is_club_staff(public.player_club_id(player_guardians.player_id)));


-- =============================================================================
-- 20260729200000_cards.sql
-- =============================================================================
-- Disciplinary / other cards recorded against a match.
-- Linked to exactly one of: player, coach, or guardian.

create type public.card_type as enum (
  'yellow_1st',
  'yellow_2nd',
  'red',
  'timeout',
  'other'
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid references public.players (id) on delete restrict,
  coach_id uuid references public.coaches (id) on delete restrict,
  guardian_id uuid references public.guardians (id) on delete restrict,
  type public.card_type not null,
  coach_notes text,
  referee_notes text,
  club_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint cards_exactly_one_person check (
    (player_id is not null)::int
    + (coach_id is not null)::int
    + (guardian_id is not null)::int = 1
  )
);

create index cards_match_id_idx on public.cards (match_id);
create index cards_player_id_idx on public.cards (player_id);
create index cards_coach_id_idx on public.cards (coach_id);
create index cards_guardian_id_idx on public.cards (guardian_id);

alter table public.cards enable row level security;

create policy "cards_select" on public.cards for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_read_team(m.team_id)
    )
  );
create policy "cards_insert" on public.cards for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );
create policy "cards_update" on public.cards for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );
create policy "cards_delete" on public.cards for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );


-- =============================================================================
-- 20260729210000_feature_requests_1.sql
-- =============================================================================
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


-- =============================================================================
-- 20260729220000_allow_duplicate_shirt_numbers.sql
-- =============================================================================
-- Shirt numbers are not unique within a team.
drop index if exists public.team_players_shirt_number_uidx;


-- =============================================================================
-- 20260729230000_multi_role_team_members.sql
-- =============================================================================
-- Allow any combination of roles per auth user per team.
-- Previously unique (team_id, user_id) forced a single role; replace with
-- unique (team_id, user_id, role). Also add team-scoped management.

alter type public.team_role add value if not exists 'management';

alter table public.team_members
  drop constraint if exists team_members_team_user_unique;

alter table public.team_members
  add constraint team_members_team_user_role_unique
  unique (team_id, user_id, role);


-- =============================================================================
-- 20260729240000_club_contact_fields.sql
-- =============================================================================
-- Club profile contact fields.

alter table public.clubs
  add column website text,
  add column email text,
  add column phone text;


-- =============================================================================
-- 20260729250000_managers_as_people.sql
-- =============================================================================
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


-- =============================================================================
-- 20260729260000_venues.sql
-- =============================================================================
-- Club venues (physical places). Teams link home / training venues by FK.

create type public.venue_surface as enum (
  'astro',
  'grass',
  'indoor',
  'varies',
  'unknown'
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  address_line1 text,
  address_line2 text,
  town_city text,
  postcode text,
  surface public.venue_surface not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index venues_club_id_idx on public.venues (club_id);

create trigger venues_set_updated_at
before update on public.venues
for each row execute function public.set_updated_at();

alter table public.venues enable row level security;

create policy "venues_select" on public.venues for select to authenticated
  using (public.can_read_club(club_id));

create policy "venues_insert_staff" on public.venues for insert to authenticated
  with check (public.is_club_staff(club_id));

create policy "venues_update_staff" on public.venues for update to authenticated
  using (public.is_club_staff(club_id))
  with check (public.is_club_staff(club_id));

create policy "venues_delete_staff" on public.venues for delete to authenticated
  using (public.is_club_staff(club_id));

-- Link teams to venues; migrate free-text home/training venue names.
alter table public.teams
  add column home_venue_id uuid references public.venues (id) on delete set null,
  add column training_venue_id uuid references public.venues (id) on delete set null;

create index teams_home_venue_id_idx on public.teams (home_venue_id);
create index teams_training_venue_id_idx on public.teams (training_venue_id);

-- Create venue rows from distinct non-empty home / training venue names per club.
with named as (
  select club_id, trim(home_venue) as name
  from public.teams
  where home_venue is not null and trim(home_venue) <> ''
  union
  select club_id, trim(training_venue) as name
  from public.teams
  where training_venue is not null and trim(training_venue) <> ''
),
inserted as (
  insert into public.venues (club_id, name, surface)
  select distinct club_id, name, 'unknown'::public.venue_surface
  from named
  returning id, club_id, name
)
update public.teams t
set
  home_venue_id = (
    select i.id
    from inserted i
    where i.club_id = t.club_id
      and i.name = trim(t.home_venue)
    limit 1
  ),
  training_venue_id = (
    select i.id
    from inserted i
    where i.club_id = t.club_id
      and i.name = trim(t.training_venue)
    limit 1
  );

alter table public.teams drop column home_venue;
alter table public.teams drop column training_venue;


-- =============================================================================
-- 20260730270000_coaches_philosophy.sql
-- =============================================================================
-- Optional coaching philosophy for staff profiles.

alter table public.coaches
  add column philosophy text;


-- =============================================================================
-- 20260730280000_match_home_away_and_venue.sql
-- =============================================================================
-- Distinguish match home/away from the physical venue place.

alter table public.matches rename column venue to home_away;

alter type public.match_venue rename to match_home_away;

alter table public.matches
  add column venue_id uuid references public.venues (id) on delete set null;

create index matches_venue_id_idx on public.matches (venue_id);


-- =============================================================================
-- 20260730290000_venue_food_and_drink.sql
-- =============================================================================
-- Food & drink options available at a venue.

create type public.venue_food_and_drink as enum (
  'cafe',
  'tuck_shop',
  'bbq',
  'byo'
);

alter table public.venues
  add column food_and_drink public.venue_food_and_drink;


-- =============================================================================
-- 20260730291000_venue_food_and_drink_multi.sql
-- =============================================================================
-- Convert venue food & drink from single value to multi-select array.

alter type public.venue_food_and_drink add value if not exists 'local_outlets';
alter type public.venue_food_and_drink add value if not exists 'ice_cream_van';

alter table public.venues
  alter column food_and_drink drop default;

alter table public.venues
  alter column food_and_drink type public.venue_food_and_drink[]
  using case
    when food_and_drink is null then '{}'::public.venue_food_and_drink[]
    when food_and_drink::text = 'byo' then '{}'::public.venue_food_and_drink[]
    else array[food_and_drink]
  end;

alter table public.venues
  alter column food_and_drink set default '{}'::public.venue_food_and_drink[],
  alter column food_and_drink set not null;


-- =============================================================================
-- 20260730300000_player_dob_match_squads_periods.sql
-- =============================================================================
-- Player DOB, match-day squads, and match periods (with starters + goal link).

-- ---------------------------------------------------------------------------
-- Players: date of birth
-- ---------------------------------------------------------------------------

alter table public.players add column date_of_birth date;

-- ---------------------------------------------------------------------------
-- Match-day squad: which team players are available for a given match
-- ---------------------------------------------------------------------------

create table public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (match_id, player_id)
);

create index match_players_match_id_idx on public.match_players (match_id);
create index match_players_player_id_idx on public.match_players (player_id);

alter table public.match_players enable row level security;

create policy "match_players_select" on public.match_players
  for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_read_team(m.team_id)
    )
  );

create policy "match_players_insert" on public.match_players
  for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );

create policy "match_players_delete" on public.match_players
  for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Match periods (halves / quarters / etc.)
-- ---------------------------------------------------------------------------

create table public.match_periods (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint match_periods_name_not_blank check (length(trim(name)) > 0)
);

create index match_periods_match_id_idx on public.match_periods (match_id);

create trigger match_periods_set_updated_at
before update on public.match_periods
for each row execute function public.set_updated_at();

alter table public.match_periods enable row level security;

create policy "match_periods_select" on public.match_periods
  for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_read_team(m.team_id)
    )
  );

create policy "match_periods_insert" on public.match_periods
  for insert to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );

create policy "match_periods_update" on public.match_periods
  for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );

create policy "match_periods_delete" on public.match_periods
  for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and public.can_edit_team(m.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Players starting each period (assumed to complete the period)
-- ---------------------------------------------------------------------------

create table public.match_period_starters (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.match_periods (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (period_id, player_id)
);

create index match_period_starters_period_id_idx
  on public.match_period_starters (period_id);
create index match_period_starters_player_id_idx
  on public.match_period_starters (player_id);

alter table public.match_period_starters enable row level security;

create policy "match_period_starters_select" on public.match_period_starters
  for select to authenticated
  using (
    exists (
      select 1
      from public.match_periods mp
      join public.matches m on m.id = mp.match_id
      where mp.id = period_id and public.can_read_team(m.team_id)
    )
  );

create policy "match_period_starters_insert" on public.match_period_starters
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.match_periods mp
      join public.matches m on m.id = mp.match_id
      where mp.id = period_id and public.can_edit_team(m.team_id)
    )
  );

create policy "match_period_starters_delete" on public.match_period_starters
  for delete to authenticated
  using (
    exists (
      select 1
      from public.match_periods mp
      join public.matches m on m.id = mp.match_id
      where mp.id = period_id and public.can_edit_team(m.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Goals: link to a match period (text period kept and synced from the name)
-- ---------------------------------------------------------------------------

alter table public.goals
  add column period_id uuid references public.match_periods (id) on delete set null;

create index goals_period_id_idx on public.goals (period_id);


-- =============================================================================
-- 20260730310000_opposition_goals.sql
-- =============================================================================
-- Allow goals scored by the opposition (no known player).

alter table public.goals
  alter column player_id drop not null;

alter table public.goals
  add column if not exists is_opposition boolean not null default false;

alter table public.goals
  drop constraint if exists goals_assist_not_scorer;

alter table public.goals
  add constraint goals_assist_not_scorer check (
    assist_player_id is null
    or (player_id is not null and assist_player_id <> player_id)
  );

alter table public.goals
  drop constraint if exists goals_opposition_scorer_consistency;

alter table public.goals
  add constraint goals_opposition_scorer_consistency check (
    (
      is_opposition = false
      and player_id is not null
    )
    or (
      is_opposition = true
      and player_id is null
      and assist_player_id is null
    )
  );

comment on column public.goals.is_opposition is
  'True when scored by the opposition; player_id and assist_player_id are null.';

comment on table public.goals is
  'Goals for a match, including our players and generic opposition goals.';


-- =============================================================================
-- 20260730320000_drop_match_score_columns.sql
-- =============================================================================
-- Score is derived from goal rows; stop storing aggregates on matches.

alter table public.matches
  drop constraint if exists matches_goals_for_non_negative;

alter table public.matches
  drop constraint if exists matches_goals_against_non_negative;

alter table public.matches
  drop column if exists goals_for;

alter table public.matches
  drop column if exists goals_against;


-- =============================================================================
-- 20260730330000_development_objectives.sql
-- =============================================================================
-- ---------------------------------------------------------------------------
-- Coach development objectives: type, target date, status
-- ---------------------------------------------------------------------------

create type public.coach_objective_type as enum (
  'coaching',
  'communications',
  'time_management',
  'admin',
  'other'
);

create type public.coach_objective_status as enum (
  'in_progress',
  'ready_for_review',
  'complete',
  'deferred'
);

alter table public.coach_development_objectives
  add column objective_type public.coach_objective_type not null default 'other',
  add column target_date date,
  add column status public.coach_objective_status not null default 'in_progress';

-- ---------------------------------------------------------------------------
-- Player development objectives
-- ---------------------------------------------------------------------------

create type public.player_objective_type as enum (
  'skills',
  'confidence',
  'team_work',
  'positional',
  'following_coaching',
  'other'
);

create type public.player_objective_status as enum (
  'emerging',
  'expected',
  'exceeding',
  'complete'
);

create table public.player_development_objectives (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  body text not null,
  objective_type public.player_objective_type not null default 'other',
  status public.player_objective_status not null default 'emerging',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index player_development_objectives_player_id_idx
  on public.player_development_objectives (player_id);

create trigger player_development_objectives_set_updated_at
before update on public.player_development_objectives
for each row execute function public.set_updated_at();

alter table public.player_development_objectives enable row level security;

create policy "player_objectives_select" on public.player_development_objectives
  for select to authenticated
  using (public.can_read_player(player_id));

create policy "player_objectives_insert" on public.player_development_objectives
  for insert to authenticated
  with check (public.can_edit_player(player_id));

create policy "player_objectives_update" on public.player_development_objectives
  for update to authenticated
  using (public.can_edit_player(player_id))
  with check (public.can_edit_player(player_id));

create policy "player_objectives_delete" on public.player_development_objectives
  for delete to authenticated
  using (public.can_edit_player(player_id));


-- =============================================================================
-- 20260730340000_own_goals.sql
-- =============================================================================
-- Own goals credited to our team (no known player), and mutually exclusive goal kinds.

alter table public.goals
  add column if not exists is_own_goal boolean not null default false;

-- Prefer a single kind flag if historical rows somehow have more than one set.
update public.goals
set
  is_freekick = false,
  from_setpiece = false
where is_penalty = true
  and (is_freekick = true or from_setpiece = true);

update public.goals
set from_setpiece = false
where is_freekick = true
  and from_setpiece = true;

alter table public.goals
  drop constraint if exists goals_opposition_scorer_consistency;

alter table public.goals
  drop constraint if exists goals_scorer_consistency;

alter table public.goals
  add constraint goals_scorer_consistency check (
    (
      is_opposition = false
      and is_own_goal = false
      and player_id is not null
    )
    or (
      is_opposition = false
      and is_own_goal = true
      and player_id is null
      and assist_player_id is null
    )
    or (
      is_opposition = true
      and is_own_goal = false
      and player_id is null
      and assist_player_id is null
    )
  );

alter table public.goals
  drop constraint if exists goals_kind_mutually_exclusive;

alter table public.goals
  add constraint goals_kind_mutually_exclusive check (
    (case when is_penalty then 1 else 0 end)
    + (case when is_freekick then 1 else 0 end)
    + (case when from_setpiece then 1 else 0 end)
    <= 1
  );

comment on column public.goals.is_own_goal is
  'True when an opposition own goal is credited to our team; player_id and assist_player_id are null.';

comment on table public.goals is
  'Goals for a match, including our players, own goals for us, and generic opposition goals.';


-- =============================================================================
-- 20260731010000_club_icon_and_colour.sql
-- =============================================================================
-- Club branding: optional icon URL and look-and-feel colour.

alter table public.clubs
  add column icon_url text,
  add column colour text;

comment on column public.clubs.icon_url is
  'Public URL for the club icon; null uses the app default football icon.';
comment on column public.clubs.colour is
  'Hex club colour (#RRGGBB) used for subtle site theming; null = default theme.';

-- Public bucket for small club icons (path: {club_id}/{filename}).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-icons',
  'club-icons',
  true,
  524288,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "club_icons_public_read"
  on storage.objects for select
  using (bucket_id = 'club-icons');

create policy "club_icons_management_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );

create policy "club_icons_management_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );

create policy "club_icons_management_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'club-icons'
    and (storage.foldername(name))[1] is not null
    and public.is_club_management(((storage.foldername(name))[1])::uuid)
  );


-- =============================================================================
-- 20260731140000_competition_attributes.sql
-- =============================================================================
-- Competition attributes: season, knockout, age group, gender, squad size, periods, notes.

create type public.competition_gender as enum ('female', 'male', 'mixed');

create type public.competition_periods as enum ('1', '2', '4', 'other');

alter table public.competitions
  add column if not exists season text,
  add column if not exists knockout boolean not null default false,
  add column if not exists age_group text,
  add column if not exists gender public.competition_gender,
  add column if not exists players_per_team integer,
  add column if not exists periods public.competition_periods not null default '2',
  add column if not exists minutes_per_period integer,
  add column if not exists notes text;

alter table public.competitions
  drop constraint if exists competitions_players_per_team_nonnegative;

alter table public.competitions
  add constraint competitions_players_per_team_nonnegative
  check (players_per_team is null or players_per_team >= 0);

alter table public.competitions
  drop constraint if exists competitions_minutes_per_period_nonnegative;

alter table public.competitions
  add constraint competitions_minutes_per_period_nonnegative
  check (minutes_per_period is null or minutes_per_period >= 0);

comment on column public.competitions.season is
  'Season label for this competition entry, e.g. 2025/26.';

comment on column public.competitions.knockout is
  'Whether the competition is knock-out format; default false (No).';

comment on column public.competitions.periods is
  'Number of periods per match: 1, 2 (halves, default), 4, or other.';


-- =============================================================================
-- 20260731150000_people_and_invitations.sql
-- =============================================================================
-- Central people identity + invite-only onboarding foundation.
-- Role tables gain person_id; shared attributes are copied onto people.
-- Shared columns on role tables are dropped in the follow-up migration after
-- auth helpers are rewritten to use people.auth_user_id.

create type public.person_account_status as enum (
  'none',
  'invited',
  'active',
  'disabled'
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  auth_user_id uuid references auth.users (id) on delete set null,
  account_status public.person_account_status not null default 'none',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint people_email_nonempty check (email is null or length(trim(email)) > 0)
);

create unique index people_auth_user_id_uidx
  on public.people (auth_user_id)
  where auth_user_id is not null;

create unique index people_email_lower_uidx
  on public.people (lower(email))
  where email is not null;

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create table public.person_invitations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint person_invitations_email_nonempty check (length(trim(email)) > 0),
  constraint person_invitations_token_hash_nonempty check (length(token_hash) > 0)
);

create index person_invitations_person_id_idx
  on public.person_invitations (person_id);

create unique index person_invitations_token_hash_uidx
  on public.person_invitations (token_hash);

create unique index person_invitations_one_outstanding_uidx
  on public.person_invitations (person_id)
  where accepted_at is null and revoked_at is null;

create trigger person_invitations_set_updated_at
before update on public.person_invitations
for each row execute function public.set_updated_at();

create table public.people_migration_conflicts (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  conflict_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index people_migration_conflicts_source_idx
  on public.people_migration_conflicts (source_table, source_id);

alter table public.managers add column person_id uuid references public.people (id);
alter table public.coaches add column person_id uuid references public.people (id);
alter table public.guardians add column person_id uuid references public.people (id);
alter table public.players add column person_id uuid references public.people (id);

-- ---------------------------------------------------------------------------
-- Collect role identity rows for backfill
-- ---------------------------------------------------------------------------

create temporary table tmp_role_identity (
  source_table text not null,
  source_id uuid not null,
  auth_user_id uuid,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  primary key (source_table, source_id)
) on commit drop;

insert into tmp_role_identity
select
  'managers', m.id, m.user_id, m.first_name, m.second_name,
  nullif(lower(trim(m.email)), ''), nullif(trim(m.phone), '')
from public.managers m;

insert into tmp_role_identity
select
  'coaches', c.id, null, c.first_name, c.second_name,
  nullif(lower(trim(c.email)), ''), nullif(trim(c.phone), '')
from public.coaches c;

insert into tmp_role_identity
select
  'guardians', g.id, g.user_id, g.first_name, g.second_name,
  nullif(lower(trim(g.email)), ''), nullif(trim(g.phone), '')
from public.guardians g;

-- Players: prefer player_contacts email/phone when present (identity contact).
insert into tmp_role_identity
select
  'players', p.id, p.user_id, p.first_name, p.last_name,
  nullif(lower(trim(pc.email)), ''), nullif(trim(pc.phone), '')
from public.players p
left join public.player_contacts pc on pc.player_id = p.id;

create temporary table tmp_role_person (
  source_table text not null,
  source_id uuid not null,
  person_id uuid not null,
  primary key (source_table, source_id)
) on commit drop;

create or replace function pg_temp.report_attr_conflicts(
  p_source_table text,
  p_source_id uuid,
  p_person_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text
) returns void
language plpgsql
as $$
declare
  v_person public.people%rowtype;
begin
  select * into v_person from public.people where id = p_person_id;

  if lower(v_person.first_name) is distinct from lower(p_first_name)
     or lower(v_person.last_name) is distinct from lower(p_last_name) then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'name_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept', jsonb_build_object(
          'first_name', v_person.first_name,
          'last_name', v_person.last_name
        ),
        'other', jsonb_build_object(
          'first_name', p_first_name,
          'last_name', p_last_name
        )
      )
    );
  end if;

  if p_email is not null
     and v_person.email is not null
     and lower(v_person.email) is distinct from lower(p_email) then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'email_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept_email', v_person.email,
        'other_email', p_email
      )
    );
  elsif p_email is not null and v_person.email is null then
    update public.people set email = p_email where id = p_person_id;
  end if;

  if p_phone is not null
     and v_person.phone is not null
     and v_person.phone is distinct from p_phone then
    insert into public.people_migration_conflicts (
      source_table, source_id, conflict_type, details
    ) values (
      p_source_table, p_source_id, 'phone_mismatch',
      jsonb_build_object(
        'person_id', p_person_id,
        'kept_phone', v_person.phone,
        'other_phone', p_phone
      )
    );
  elsif p_phone is not null and v_person.phone is null then
    update public.people set phone = p_phone where id = p_person_id;
  end if;
end;
$$;

-- 1) One person per distinct auth_user_id
do $$
declare
  uid uuid;
  seed record;
  row_rec record;
  v_person_id uuid;
begin
  for uid in
    select distinct auth_user_id from tmp_role_identity where auth_user_id is not null
  loop
    select * into seed
    from tmp_role_identity
    where auth_user_id = uid
    order by
      case source_table
        when 'managers' then 1
        when 'guardians' then 2
        when 'players' then 3
        else 4
      end,
      source_id
    limit 1;

    insert into public.people (
      first_name, last_name, email, phone, auth_user_id, account_status
    ) values (
      seed.first_name,
      seed.last_name,
      seed.email,
      seed.phone,
      uid,
      'active'::public.person_account_status
    )
    returning id into v_person_id;

    for row_rec in
      select * from tmp_role_identity where auth_user_id = uid
    loop
      perform pg_temp.report_attr_conflicts(
        row_rec.source_table,
        row_rec.source_id,
        v_person_id,
        row_rec.first_name,
        row_rec.last_name,
        row_rec.email,
        row_rec.phone
      );
      insert into tmp_role_person (source_table, source_id, person_id)
      values (row_rec.source_table, row_rec.source_id, v_person_id);
    end loop;
  end loop;
end $$;

-- 2) Merge remaining rows that share an email (no auth clash)
do $$
declare
  email_key text;
  seed record;
  row_rec record;
  v_person_id uuid;
  v_existing public.people%rowtype;
  v_new_person_id uuid;
begin
  for email_key in
    select distinct i.email
    from tmp_role_identity i
    left join tmp_role_person tp
      on tp.source_table = i.source_table and tp.source_id = i.source_id
    where i.email is not null and tp.person_id is null
  loop
    select * into v_existing
    from public.people
    where email is not null and lower(email) = email_key
    limit 1;

    if v_existing.id is null then
      select * into seed
      from tmp_role_identity i
      left join tmp_role_person tp
        on tp.source_table = i.source_table and tp.source_id = i.source_id
      where i.email = email_key and tp.person_id is null
      order by
        case i.source_table
          when 'managers' then 1
          when 'guardians' then 2
          when 'coaches' then 3
          else 4
        end,
        i.source_id
      limit 1;

      insert into public.people (
        first_name, last_name, email, phone, auth_user_id, account_status
      ) values (
        seed.first_name,
        seed.last_name,
        seed.email,
        seed.phone,
        seed.auth_user_id,
        case
          when seed.auth_user_id is not null then 'active'::public.person_account_status
          else 'none'::public.person_account_status
        end
      )
      returning id into v_person_id;
    else
      v_person_id := v_existing.id;
    end if;

    for row_rec in
      select i.*
      from tmp_role_identity i
      left join tmp_role_person tp
        on tp.source_table = i.source_table and tp.source_id = i.source_id
      where i.email = email_key and tp.person_id is null
    loop
      select * into v_existing from public.people where id = v_person_id;

      if row_rec.auth_user_id is not null
         and v_existing.auth_user_id is not null
         and v_existing.auth_user_id is distinct from row_rec.auth_user_id then
        insert into public.people_migration_conflicts (
          source_table, source_id, conflict_type, details
        ) values (
          row_rec.source_table,
          row_rec.source_id,
          'user_id_clash',
          jsonb_build_object(
            'kept_person_id', v_person_id,
            'kept_auth_user_id', v_existing.auth_user_id,
            'other_auth_user_id', row_rec.auth_user_id,
            'email', email_key
          )
        );

        insert into public.people (
          first_name, last_name, email, phone, auth_user_id, account_status
        ) values (
          row_rec.first_name,
          row_rec.last_name,
          null,
          row_rec.phone,
          row_rec.auth_user_id,
          'active'::public.person_account_status
        )
        returning id into v_new_person_id;

        insert into public.people_migration_conflicts (
          source_table, source_id, conflict_type, details
        ) values (
          row_rec.source_table,
          row_rec.source_id,
          'email_deferred_for_user_clash',
          jsonb_build_object(
            'new_person_id', v_new_person_id,
            'deferred_email', email_key
          )
        );

        insert into tmp_role_person (source_table, source_id, person_id)
        values (row_rec.source_table, row_rec.source_id, v_new_person_id);
      else
        perform pg_temp.report_attr_conflicts(
          row_rec.source_table,
          row_rec.source_id,
          v_person_id,
          row_rec.first_name,
          row_rec.last_name,
          row_rec.email,
          row_rec.phone
        );

        if row_rec.auth_user_id is not null and v_existing.auth_user_id is null then
          update public.people
          set auth_user_id = row_rec.auth_user_id,
              account_status = 'active'
          where id = v_person_id;
        end if;

        insert into tmp_role_person (source_table, source_id, person_id)
        values (row_rec.source_table, row_rec.source_id, v_person_id);
      end if;
    end loop;
  end loop;
end $$;

-- 3) Remaining rows: dedicated person each (no shared email / auth)
do $$
declare
  row_rec record;
  v_person_id uuid;
begin
  for row_rec in
    select i.*
    from tmp_role_identity i
    left join tmp_role_person tp
      on tp.source_table = i.source_table and tp.source_id = i.source_id
    where tp.person_id is null
  loop
    insert into public.people (
      first_name, last_name, email, phone, auth_user_id, account_status
    ) values (
      row_rec.first_name,
      row_rec.last_name,
      row_rec.email,
      row_rec.phone,
      row_rec.auth_user_id,
      case
        when row_rec.auth_user_id is not null then 'active'::public.person_account_status
        else 'none'::public.person_account_status
      end
    )
    returning id into v_person_id;

    insert into tmp_role_person (source_table, source_id, person_id)
    values (row_rec.source_table, row_rec.source_id, v_person_id);
  end loop;
end $$;

update public.managers m
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'managers' and tp.source_id = m.id;

update public.coaches c
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'coaches' and tp.source_id = c.id;

update public.guardians g
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'guardians' and tp.source_id = g.id;

update public.players p
set person_id = tp.person_id
from tmp_role_person tp
where tp.source_table = 'players' and tp.source_id = p.id;

do $$
begin
  if exists (select 1 from public.managers where person_id is null)
     or exists (select 1 from public.coaches where person_id is null)
     or exists (select 1 from public.guardians where person_id is null)
     or exists (select 1 from public.players where person_id is null) then
    raise exception 'people backfill left role rows without person_id';
  end if;
end $$;

alter table public.managers alter column person_id set not null;
alter table public.coaches alter column person_id set not null;
alter table public.guardians alter column person_id set not null;
alter table public.players alter column person_id set not null;

create index managers_person_id_idx on public.managers (person_id);
create index coaches_person_id_idx on public.coaches (person_id);
create index guardians_person_id_idx on public.guardians (person_id);
create index players_person_id_idx on public.players (person_id);

-- ---------------------------------------------------------------------------
-- RLS for people / invitations (equivalent spirit; no new RBAC matrix)
-- ---------------------------------------------------------------------------

alter table public.people enable row level security;
alter table public.person_invitations enable row level security;
alter table public.people_migration_conflicts enable row level security;

create or replace function public.can_manage_any_club()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.managers m
    where m.user_id = auth.uid()
  );
$$;

revoke all on function public.can_manage_any_club() from public;
grant execute on function public.can_manage_any_club() to authenticated;

create policy "people_select" on public.people for select to authenticated
  using (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
    or exists (
      select 1 from public.managers m
      where m.person_id = people.id and public.is_club_staff(m.club_id)
    )
    or exists (
      select 1 from public.coaches c
      where c.person_id = people.id and public.is_club_staff(c.club_id)
    )
    or exists (
      select 1 from public.guardians g
      where g.person_id = people.id and public.is_club_staff(g.club_id)
    )
    or exists (
      select 1 from public.players pl
      where pl.person_id = people.id and public.is_club_staff(pl.club_id)
    )
  );

create policy "people_insert_management" on public.people for insert to authenticated
  with check (public.can_manage_any_club());

create policy "people_update" on public.people for update to authenticated
  using (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
  )
  with check (
    people.auth_user_id = auth.uid()
    or public.can_manage_any_club()
  );

create policy "person_invitations_select" on public.person_invitations
  for select to authenticated
  using (
    public.can_manage_any_club()
    or exists (
      select 1 from public.people p
      where p.id = person_invitations.person_id and p.auth_user_id = auth.uid()
    )
  );

create policy "person_invitations_insert" on public.person_invitations
  for insert to authenticated
  with check (public.can_manage_any_club());

create policy "person_invitations_update" on public.person_invitations
  for update to authenticated
  using (public.can_manage_any_club())
  with check (public.can_manage_any_club());

create policy "people_migration_conflicts_select" on public.people_migration_conflicts
  for select to authenticated
  using (public.can_manage_any_club());


-- =============================================================================
-- 20260731160000_people_auth_helpers_and_drop_shared.sql
-- =============================================================================
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
-- Keep the parameter name p_user_id so CREATE OR REPLACE is allowed (Postgres
-- rejects renaming args). Callers now pass players.person_id; the body resolves
-- auth via people. Auth semantics change; the arg name is historical.
create or replace function public.can_read_player_row(
  p_player_id uuid,
  p_club_id uuid,
  p_user_id uuid
)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_club_staff(p_club_id)
    or public.person_auth_user_id(p_user_id) = auth.uid()
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


-- =============================================================================
-- 20260802120000_rename_half_period_labels.sql
-- =============================================================================
-- Rename half period labels for display consistency.
update public.match_periods
set name = 'First half'
where name = 'Half 1';

update public.match_periods
set name = 'Second half'
where name = 'Half 2';

update public.goals
set period = 'First half'
where period = 'Half 1';

update public.goals
set period = 'Second half'
where period = 'Half 2';


-- =============================================================================
-- 20260802180000_role_active_flag.sql
-- =============================================================================
-- Soft-deactivate club roles so historic records (goals, etc.) stay linked.

alter table public.players
  add column active_role boolean not null default true;

alter table public.coaches
  add column active_role boolean not null default true;

alter table public.guardians
  add column active_role boolean not null default true;

alter table public.managers
  add column active_role boolean not null default true;

create index players_club_active_role_idx
  on public.players (club_id)
  where active_role;

create index coaches_club_active_role_idx
  on public.coaches (club_id)
  where active_role;

create index guardians_club_active_role_idx
  on public.guardians (club_id)
  where active_role;

create index managers_club_active_role_idx
  on public.managers (club_id)
  where active_role;


-- =============================================================================
-- 20260802210000_player_guardian_emergency_contact.sql
-- =============================================================================
-- Emergency contact as a flag on the guardian–player relationship.

alter table public.player_guardians
  add column emergency_contact boolean not null default false;

-- At most one emergency contact per player.
create unique index player_guardians_one_emergency_per_player_idx
  on public.player_guardians (player_id)
  where emergency_contact;

-- Backfill from the previous player_contacts.emergency_guardian_id pointer.
update public.player_guardians pg
set emergency_contact = true
from public.player_contacts pc
where pc.player_id = pg.player_id
  and pc.emergency_guardian_id = pg.guardian_id;


-- =============================================================================
-- 20260802220000_venue_surface_multi_and_amenities.sql
-- =============================================================================
-- Add Hard Court + amenity enum values; convert venues.surface to multi-select array.

alter type public.venue_surface add value if not exists 'hard_court';

alter type public.venue_food_and_drink add value if not exists 'bar';
alter type public.venue_food_and_drink add value if not exists 'toilets';
alter type public.venue_food_and_drink add value if not exists 'rain_shelter';

alter table public.venues
  alter column surface drop default;

alter table public.venues
  alter column surface type public.venue_surface[]
  using case
    when surface is null then '{}'::public.venue_surface[]
    else array[surface]
  end;

alter table public.venues
  alter column surface set default '{}'::public.venue_surface[],
  alter column surface set not null;


-- =============================================================================
-- 20260802230000_venue_parking.sql
-- =============================================================================
-- Single-select parking status for venues.

create type public.venue_parking as enum (
  'usually_fine',
  'weekend_parking',
  'paid_parking',
  'no_parking',
  'unknown'
);

alter table public.venues
  add column parking public.venue_parking not null default 'unknown';


-- =============================================================================
-- 20260802240000_club_established_and_about.sql
-- =============================================================================
-- Club established year and about / philosophy text.

alter table public.clubs
  add column established smallint,
  add column about text;

alter table public.clubs
  add constraint clubs_established_year_check
  check (
    established is null
    or (established >= 1800 and established <= 2100)
  );


-- =============================================================================
-- 20260810180000_feature_requests_1_extensions.sql
-- =============================================================================
-- Competition result, team photo, and player of the month.

-- ---------------------------------------------------------------------------
-- Competition result
-- ---------------------------------------------------------------------------

create type public.competition_result as enum (
  'champions',
  'runner_up',
  'third_place',
  'semi_final',
  'knock_outs',
  'group_stage',
  'promoted',
  'relegated',
  'none',
  'ongoing'
);

alter table public.competitions
  add column result public.competition_result not null default 'ongoing';

comment on column public.competitions.result is
  'How the team finished in this competition; default ongoing.';

-- ---------------------------------------------------------------------------
-- Team photo
-- ---------------------------------------------------------------------------

alter table public.teams
  add column photo_url text;

comment on column public.teams.photo_url is
  'Public URL for the team photo; displayed above the team profile card.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-photos',
  'team-photos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "team_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'team-photos');

create policy "team_photos_edit_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'team-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_edit_team(((storage.foldername(name))[1])::uuid)
  );

create policy "team_photos_edit_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'team-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_edit_team(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'team-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_edit_team(((storage.foldername(name))[1])::uuid)
  );

create policy "team_photos_edit_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'team-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_edit_team(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- Player of the month
-- ---------------------------------------------------------------------------

create table public.player_of_the_month (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  month date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_of_the_month_month_first_day
    check (extract(day from month) = 1),
  constraint player_of_the_month_team_month_unique unique (team_id, month)
);

create index player_of_the_month_team_id_idx
  on public.player_of_the_month (team_id, month desc);

create trigger player_of_the_month_set_updated_at
  before update on public.player_of_the_month
  for each row execute function public.set_updated_at();

alter table public.player_of_the_month enable row level security;

create policy "player_of_the_month_select_member"
  on public.player_of_the_month for select
  using (public.can_read_team(team_id));

create policy "player_of_the_month_insert_edit"
  on public.player_of_the_month for insert
  with check (public.can_edit_team(team_id));

create policy "player_of_the_month_update_edit"
  on public.player_of_the_month for update
  using (public.can_edit_team(team_id))
  with check (public.can_edit_team(team_id));

create policy "player_of_the_month_delete_edit"
  on public.player_of_the_month for delete
  using (public.can_edit_team(team_id));


-- =============================================================================
-- 20260810200000_team_gender_men_women.sql
-- =============================================================================
-- Add Men / Women team gender values alongside boys / girls / mixed.
alter type public.team_gender add value if not exists 'men';
alter type public.team_gender add value if not exists 'women';


-- =============================================================================
-- 20260811120000_feature_requests_1_ui.sql
-- =============================================================================
-- Feature requests batch 1 UI follow-ups: competition result/venue/organizer,
-- and team display name.

-- ---------------------------------------------------------------------------
-- Competition result: completed + cancelled
-- ---------------------------------------------------------------------------

alter type public.competition_result add value if not exists 'completed';
alter type public.competition_result add value if not exists 'cancelled';

-- ---------------------------------------------------------------------------
-- Competition organizer + venue selection
-- ---------------------------------------------------------------------------

alter table public.competitions
  add column if not exists organizer text,
  add column if not exists venue_id uuid references public.venues (id) on delete set null,
  add column if not exists venue_mode text not null default 'unknown';

alter table public.competitions
  drop constraint if exists competitions_venue_mode_check;

alter table public.competitions
  add constraint competitions_venue_mode_check
  check (venue_mode in ('unknown', 'multiple', 'venue'));

alter table public.competitions
  drop constraint if exists competitions_venue_mode_consistency;

alter table public.competitions
  add constraint competitions_venue_mode_consistency
  check (
    (venue_mode = 'venue' and venue_id is not null)
    or (venue_mode in ('unknown', 'multiple') and venue_id is null)
  );

comment on column public.competitions.organizer is
  'Free-text competition organizer, e.g. county FA or league body.';

comment on column public.competitions.venue_mode is
  'Competition venue selection: a configured venue, unknown, or multiple.';

comment on column public.competitions.venue_id is
  'Configured venue when venue_mode is venue; otherwise null.';

-- ---------------------------------------------------------------------------
-- Team display name
-- ---------------------------------------------------------------------------

alter table public.teams
  add column if not exists display_name text;

comment on column public.teams.display_name is
  'Optional short name shown in dashboard, matches, and stats headers.';


-- =============================================================================
-- 20260811180000_team_season_archive.sql
-- =============================================================================
-- Team season archival: keep historical team rows (matches, roster, scorers)
-- while marking a season closed. Unique identity is club + name + season.

alter table public.teams
  add column if not exists archived_at timestamptz;

comment on column public.teams.archived_at is
  'When set, this season''s team record is archived. Historical matches, roster, and stats remain available.';

-- Enforce team name + season uniqueness within a club (the product identity).
create unique index if not exists teams_club_name_season_uidx
  on public.teams (club_id, name, season_label);

create index if not exists teams_archived_at_idx
  on public.teams (archived_at)
  where archived_at is not null;


-- =============================================================================
-- 20260812120000_people_select_team_readers.sql
-- =============================================================================
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


-- =============================================================================
-- 20260812140000_guardian_assistant_match_day.sql
-- =============================================================================
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



-- Table/sequence privileges for PostgREST roles.
-- Hosted projects often inherit these; local CLI Postgres does not.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on routines to anon, authenticated, service_role;
