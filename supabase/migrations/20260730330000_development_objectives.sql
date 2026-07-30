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
