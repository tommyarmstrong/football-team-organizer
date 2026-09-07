-- Optional meet-up time for fixtures (shown for scheduled matches).

alter table public.matches
  add column if not exists meetup_time time;

comment on column public.matches.meetup_time is
  'Optional time for players/coaches to meet before kick-off.';
