-- Bootstrap seed: bare minimum for a new deployment.
--
-- Creates:
--   - 1 generic club (Demo Club)
--   - 1 club manager (John Hall) + people row
--
-- Does not create Auth users, teams, venues, players, coaches, or matches.
-- For the full England demo dataset, also load (or only load) supabase/england.sql.
-- england.sql uses the same club and manager ids, so it can run alone or after
-- this file.
--
-- AFTER SEEDING (initial admin):
-- 1. Create a user in Supabase Auth (Authentication -> Users), or sign in once.
-- 2. In Table Editor -> people, set John Hall's auth_user_id to that Auth user UUID
--    and account_status to 'active'. That person is already a club manager.
--
-- Apply via Supabase SQL Editor (Dashboard -> SQL), or:
--   npx supabase db query --linked -f supabase/seed.sql
--   npx supabase db query -f supabase/seed.sql
--
-- Idempotent for the fixed ids below. Re-running updates seed domain rows only.
-- people.auth_user_id is never set or cleared by this file (manual Auth links
-- survive reseed).
--
-- Seed person/role ids use UUID hex only (0-9a-f). Do not use letters outside that
-- range (e.g. p000… is invalid and will fail to insert).

begin;

-- Fixed ids so re-seeding is predictable in local/dev.
-- Do not overwrite an existing club (e.g. after england.sql enriched the FA club).
insert into public.clubs (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Demo Club')
on conflict (id) do nothing;

-- Club manager: John Hall (people + managers role).
-- Do not set auth_user_id here; link the first Auth user manually after seed.
-- On conflict, preserve auth_user_id and account_status.
insert into public.people (
  id, first_name, last_name, account_status
) values (
  'b0000000-0000-4000-8000-000000000001',
  'John',
  'Hall',
  'none'
)
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.managers (id, club_id, person_id)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'b0000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id;

commit;
