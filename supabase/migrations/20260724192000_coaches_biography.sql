-- Optional biography for coaching staff profiles.

alter table public.coaches
  add column biography text;
