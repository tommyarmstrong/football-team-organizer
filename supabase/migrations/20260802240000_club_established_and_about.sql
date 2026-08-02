-- Club established year and about / philosophy text.

alter table public.clubs
  add column established smallint,
  add column about text;

alter table public.clubs
  add constraint clubs_established_year_check
  check (
    established is null
    or (established >= 1800 and established <= 2100)
  );
