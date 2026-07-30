-- Food & drink options available at a venue.

create type public.venue_food_and_drink as enum (
  'cafe',
  'tuck_shop',
  'bbq',
  'byo'
);

alter table public.venues
  add column food_and_drink public.venue_food_and_drink;
