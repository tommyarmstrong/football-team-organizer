-- Distinguish match home/away from the physical venue place.

alter table public.matches rename column venue to home_away;

alter type public.match_venue rename to match_home_away;

alter table public.matches
  add column venue_id uuid references public.venues (id) on delete set null;

create index matches_venue_id_idx on public.matches (venue_id);
