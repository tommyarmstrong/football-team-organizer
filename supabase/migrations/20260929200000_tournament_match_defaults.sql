-- Tournament competitions share a date, meet-up, and home/away across their matches.
-- Cup and tournament matches record which stage of the competition they belong to.

alter table public.competitions
  add column date date,
  add column meetup_time time,
  add column home_away public.match_home_away;

alter table public.competitions
  add constraint competitions_tournament_schedule_check
  check (
    kind = 'tournament'
    or (
      date is null
      and meetup_time is null
      and home_away is null
    )
  );

comment on column public.competitions.date is
  'Shared match date for a tournament. Null for every other competition kind.';
comment on column public.competitions.meetup_time is
  'Shared meet-up time for a tournament. Null for every other competition kind.';
comment on column public.competitions.home_away is
  'Shared home, away, or neutral for a tournament. Null for every other competition kind.';

create type public.match_stage as enum (
  'group',
  'final',
  'semi_final',
  'quarter_final',
  'knockout'
);

alter table public.matches
  add column stage public.match_stage;

comment on column public.matches.stage is
  'Round for a cup or tournament fixture. Null for leagues, friendlies, and other kinds.';
