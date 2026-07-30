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
