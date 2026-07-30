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
