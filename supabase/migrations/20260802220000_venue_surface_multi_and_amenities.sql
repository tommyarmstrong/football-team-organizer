-- Add Hard Court + amenity enum values; convert venues.surface to multi-select array.

alter type public.venue_surface add value if not exists 'hard_court';

alter type public.venue_food_and_drink add value if not exists 'bar';
alter type public.venue_food_and_drink add value if not exists 'toilets';
alter type public.venue_food_and_drink add value if not exists 'rain_shelter';

alter table public.venues
  alter column surface drop default;

alter table public.venues
  alter column surface type public.venue_surface[]
  using case
    when surface is null then '{}'::public.venue_surface[]
    else array[surface]
  end;

alter table public.venues
  alter column surface set default '{}'::public.venue_surface[],
  alter column surface set not null;
