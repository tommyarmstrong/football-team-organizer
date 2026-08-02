-- Soft-deactivate club roles so historic records (goals, etc.) stay linked.

alter table public.players
  add column active_role boolean not null default true;

alter table public.coaches
  add column active_role boolean not null default true;

alter table public.guardians
  add column active_role boolean not null default true;

alter table public.managers
  add column active_role boolean not null default true;

create index players_club_active_role_idx
  on public.players (club_id)
  where active_role;

create index coaches_club_active_role_idx
  on public.coaches (club_id)
  where active_role;

create index guardians_club_active_role_idx
  on public.guardians (club_id)
  where active_role;

create index managers_club_active_role_idx
  on public.managers (club_id)
  where active_role;
