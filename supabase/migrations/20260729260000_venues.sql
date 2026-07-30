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
