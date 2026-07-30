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
