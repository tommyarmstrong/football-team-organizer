-- Single-select parking status for venues.

create type public.venue_parking as enum (
  'usually_fine',
  'weekend_parking',
  'paid_parking',
  'no_parking',
  'unknown'
);

alter table public.venues
  add column parking public.venue_parking not null default 'unknown';
