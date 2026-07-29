-- Club profile contact fields.

alter table public.clubs
  add column website text,
  add column email text,
  add column phone text;
