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
