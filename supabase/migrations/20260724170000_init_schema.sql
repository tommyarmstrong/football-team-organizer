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
