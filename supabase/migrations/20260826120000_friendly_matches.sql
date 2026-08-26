-- Friendly fixtures are match-level flags, not competition_kind values.
-- Friendlies must not appear in the competitions table.

alter table public.matches
  add column if not exists is_friendly boolean not null default false;

comment on column public.matches.is_friendly is
  'True when the fixture is a friendly (available to all teams; not a competitions row).';

-- Convert any historical friendly competitions into match flags.
update public.matches as m
set
  is_friendly = true,
  competition_id = null
from public.competitions as c
where m.competition_id = c.id
  and c.kind = 'friendly';

delete from public.competitions
where kind = 'friendly';

alter table public.matches
  drop constraint if exists matches_friendly_xor_competition;

alter table public.matches
  add constraint matches_friendly_xor_competition check (
    is_friendly = false
    or (is_friendly = true and competition_id is null)
  );

-- Rebuild competition_kind without 'friendly'.
alter type public.competition_kind rename to competition_kind_old;

create type public.competition_kind as enum (
  'league',
  'cup',
  'tournament',
  'other'
);

alter table public.competitions
  alter column kind drop default;

alter table public.competitions
  alter column kind type public.competition_kind
  using (
    case
      when kind is null then null
      else kind::text::public.competition_kind
    end
  );

drop type public.competition_kind_old;
