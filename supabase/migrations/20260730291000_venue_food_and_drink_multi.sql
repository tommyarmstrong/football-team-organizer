-- Convert venue food & drink from single value to multi-select array.

alter type public.venue_food_and_drink add value if not exists 'local_outlets';
alter type public.venue_food_and_drink add value if not exists 'ice_cream_van';

alter table public.venues
  alter column food_and_drink drop default;

alter table public.venues
  alter column food_and_drink type public.venue_food_and_drink[]
  using case
    when food_and_drink is null then '{}'::public.venue_food_and_drink[]
    when food_and_drink::text = 'byo' then '{}'::public.venue_food_and_drink[]
    else array[food_and_drink]
  end;

alter table public.venues
  alter column food_and_drink set default '{}'::public.venue_food_and_drink[],
  alter column food_and_drink set not null;
