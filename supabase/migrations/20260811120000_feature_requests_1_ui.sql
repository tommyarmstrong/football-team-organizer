-- Feature requests batch 1 UI follow-ups: competition result/venue/organizer,
-- and team display name.

-- ---------------------------------------------------------------------------
-- Competition result: completed + cancelled
-- ---------------------------------------------------------------------------

alter type public.competition_result add value if not exists 'completed';
alter type public.competition_result add value if not exists 'cancelled';

-- ---------------------------------------------------------------------------
-- Competition organizer + venue selection
-- ---------------------------------------------------------------------------

alter table public.competitions
  add column if not exists organizer text,
  add column if not exists venue_id uuid references public.venues (id) on delete set null,
  add column if not exists venue_mode text not null default 'unknown';

alter table public.competitions
  drop constraint if exists competitions_venue_mode_check;

alter table public.competitions
  add constraint competitions_venue_mode_check
  check (venue_mode in ('unknown', 'multiple', 'venue'));

alter table public.competitions
  drop constraint if exists competitions_venue_mode_consistency;

alter table public.competitions
  add constraint competitions_venue_mode_consistency
  check (
    (venue_mode = 'venue' and venue_id is not null)
    or (venue_mode in ('unknown', 'multiple') and venue_id is null)
  );

comment on column public.competitions.organizer is
  'Free-text competition organizer, e.g. county FA or league body.';

comment on column public.competitions.venue_mode is
  'Competition venue selection: a configured venue, unknown, or multiple.';

comment on column public.competitions.venue_id is
  'Configured venue when venue_mode is venue; otherwise null.';

-- ---------------------------------------------------------------------------
-- Team display name
-- ---------------------------------------------------------------------------

alter table public.teams
  add column if not exists display_name text;

comment on column public.teams.display_name is
  'Optional short name shown in dashboard, matches, and stats headers.';
