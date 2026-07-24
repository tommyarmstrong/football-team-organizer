-- Local / dev seed: one team + one coach/admin membership.
--
-- BEFORE RUNNING:
-- 1. Create a user in Supabase Auth (Authentication → Users), or sign in once.
-- 2. Copy that user's UUID from the Auth users table.
-- 3. Replace BOTH occurrences of '00000000-0000-0000-0000-000000000000' below
--    with that UUID.
--
-- Apply via Supabase SQL Editor (Dashboard → SQL), or:
--   npx supabase db query --linked -f supabase/seed.sql
--
-- This script is idempotent for the fixed team id below. Re-running updates
-- the team row and upserts membership for the configured user.

begin;

-- Fixed UUID so re-seeding is predictable in local/dev.
-- Change only if you need a different team id.
with upserted_team as (
  insert into public.teams (
    id,
    club,
    name,
    age_group,
    gender,
    home_ground,
    head_coach_name,
    season_label
  )
  values (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Example FC',
    'U11 Blues',
    'U11',
    'mixed',
    'Example Recreation Ground',
    'Alex Coach',
    '2025/26'
  )
  on conflict (id) do update set
    club = excluded.club,
    name = excluded.name,
    age_group = excluded.age_group,
    gender = excluded.gender,
    home_ground = excluded.home_ground,
    head_coach_name = excluded.head_coach_name,
    season_label = excluded.season_label
  returning id
)
insert into public.team_members (team_id, user_id, role)
select
  upserted_team.id,
  '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid, -- <-- replace with your Auth user UUID
  'admin'::public.team_member_role
from upserted_team
on conflict (team_id, user_id) do update set
  role = excluded.role;

commit;
