-- Optional short label for competitions (lists and match headers).

alter table public.competitions
  add column if not exists display_name text;

comment on column public.competitions.display_name is
  'Optional short name shown in lists and match headers; falls back to name.';
