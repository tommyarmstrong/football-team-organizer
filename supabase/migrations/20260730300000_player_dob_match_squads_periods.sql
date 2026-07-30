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
