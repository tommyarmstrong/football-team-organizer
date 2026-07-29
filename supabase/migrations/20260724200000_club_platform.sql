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
