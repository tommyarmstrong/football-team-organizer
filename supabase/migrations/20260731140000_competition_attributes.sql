-- Competition attributes: season, knockout, age group, gender, squad size, periods, notes.

create type public.competition_gender as enum ('female', 'male', 'mixed');

create type public.competition_periods as enum ('1', '2', '4', 'other');

alter table public.competitions
  add column if not exists season text,
  add column if not exists knockout boolean not null default false,
  add column if not exists age_group text,
  add column if not exists gender public.competition_gender,
  add column if not exists players_per_team integer,
  add column if not exists periods public.competition_periods not null default '2',
  add column if not exists minutes_per_period integer,
  add column if not exists notes text;

alter table public.competitions
  drop constraint if exists competitions_players_per_team_nonnegative;

alter table public.competitions
  add constraint competitions_players_per_team_nonnegative
  check (players_per_team is null or players_per_team >= 0);

alter table public.competitions
  drop constraint if exists competitions_minutes_per_period_nonnegative;

alter table public.competitions
  add constraint competitions_minutes_per_period_nonnegative
  check (minutes_per_period is null or minutes_per_period >= 0);

comment on column public.competitions.season is
  'Season label for this competition entry, e.g. 2025/26.';

comment on column public.competitions.knockout is
  'Whether the competition is knock-out format; default false (No).';

comment on column public.competitions.periods is
  'Number of periods per match: 1, 2 (halves, default), 4, or other.';
