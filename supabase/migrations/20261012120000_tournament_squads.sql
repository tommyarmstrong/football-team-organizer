-- Players selected for a tournament. New matches in that tournament copy this
-- squad instead of the full team roster.

create table public.competition_players (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (competition_id, player_id)
);

create index competition_players_competition_id_idx
  on public.competition_players (competition_id);
create index competition_players_player_id_idx
  on public.competition_players (player_id);

comment on table public.competition_players is
  'Tournament squad. Match-day squads for matches in that tournament start from this list.';

alter table public.competition_players enable row level security;

create policy "competition_players_select" on public.competition_players
  for select to authenticated
  using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and public.can_read_team(c.team_id)
    )
  );

create policy "competition_players_insert" on public.competition_players
  for insert to authenticated
  with check (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and public.can_edit_match_day(c.team_id)
    )
  );

create policy "competition_players_delete" on public.competition_players
  for delete to authenticated
  using (
    exists (
      select 1 from public.competitions c
      where c.id = competition_id and public.can_edit_match_day(c.team_id)
    )
  );

-- Existing tournaments start with every active player on the team squad.
insert into public.competition_players (competition_id, player_id)
select c.id, tp.player_id
from public.competitions c
join public.team_players tp
  on tp.team_id = c.team_id
 and tp.active
where c.kind = 'tournament';
