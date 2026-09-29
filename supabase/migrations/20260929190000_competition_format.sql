-- Replace competitions.knockout with a format enum.
-- Existing rows: knockout true -> knockout; kind league -> league; otherwise other.

create type public.competition_format as enum (
  'league',
  'knockout',
  'groups_and_knockout',
  'other'
);

alter table public.competitions
  add column format public.competition_format;

update public.competitions
set format = case
  when knockout then 'knockout'::public.competition_format
  when kind = 'league' then 'league'::public.competition_format
  else 'other'::public.competition_format
end;

alter table public.competitions
  alter column format set default 'league',
  alter column format set not null;

alter table public.competitions
  drop column knockout;

comment on column public.competitions.format is
  'How the competition is structured: league, knockout, groups and knockout, or other.';
