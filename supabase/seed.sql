-- Local / dev seed: club, teams, management membership, coaches, and players.
--
-- BEFORE RUNNING:
-- 1. Create a user in Supabase Auth (Authentication -> Users), or sign in once.
-- 2. Copy that user's UUID from the Auth users table.
-- 3. Replace the placeholder UUID below with that UUID.
--
-- Apply via Supabase SQL Editor (Dashboard -> SQL), or:
--   npx supabase db query --linked -f supabase/seed.sql
--
-- Idempotent for the fixed ids below. Re-running updates the club/team/coach/player
-- rows and upserts the management membership for the configured user.

begin;

-- Fixed ids so re-seeding is predictable in local/dev.
with upserted_club as (
  insert into public.clubs (id, name)
  values ('11111111-1111-1111-1111-111111111111', 'Example FC')
  on conflict (id) do update set name = excluded.name
  returning id
),
upserted_team as (
  insert into public.teams (
    id,
    club_id,
    name,
    age_group,
    gender,
    home_ground,
    head_coach_name,
    season_label
  )
  values (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'U11 Blues',
    'U11',
    'mixed',
    'Example Recreation Ground',
    'Eddie Howe',
    '2025/26'
  )
  on conflict (id) do update set
    club_id = excluded.club_id,
    name = excluded.name,
    age_group = excluded.age_group,
    gender = excluded.gender,
    home_ground = excluded.home_ground,
    head_coach_name = excluded.head_coach_name,
    season_label = excluded.season_label
  returning id
)
insert into public.club_members (club_id, user_id, role)
select
  upserted_club.id,
  '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid, -- <-- replace with your Auth user UUID
  'management'::public.club_role
from upserted_club
on conflict (club_id, user_id) do update set
  role = excluded.role;

-- England 1966 World Cup team.
insert into public.teams (
  id,
  club_id,
  name,
  age_group,
  gender,
  home_ground,
  head_coach_name,
  season_label
)
values (
  'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'England',
  'Adults',
  'boys',
  'Wembley',
  'Alf Ramsey',
  '1966'
)
on conflict (id) do update set
  club_id = excluded.club_id,
  name = excluded.name,
  age_group = excluded.age_group,
  gender = excluded.gender,
  home_ground = excluded.home_ground,
  head_coach_name = excluded.head_coach_name,
  season_label = excluded.season_label;

-- Club coaching staff.
insert into public.coaches (
  id,
  club_id,
  first_name,
  second_name,
  joined_date,
  dbs_checked,
  fa_level_1,
  fa_level_2,
  biography
)
values
  (
    'c0000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Kevin',
    'Keegan',
    '2022-09-01',
    true,
    true,
    true,
    'Kevin Keegan English football''s greatest and most charismatic managers, renowned for his attacking philosophy and ability to inspire teams. He guided Newcastle United from the second tier to the Premier League and transformed them into title challengers with an exciting, free-flowing style that became known as "The Entertainers." He later won the First Division title with Manchester City, earning promotion to the Premier League, and also managed the England national team between 1999 and 2000. Keegan''s coaching legacy is defined by positive, attack-minded football, strong man-management, and his ability to galvanize clubs and supporters.'
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Bobby',
    'Robson',
    '2022-09-01',
    true,
    true,
    true,
    'Sir Bobby Robson was England''s most respected and successful football managers, enjoying a distinguished career spanning more than three decades. He led Ipswich Town to FA Cup and UEFA Cup success before taking England to the semi-finals of the 1990 FIFA World Cup. Robson also managed top clubs across Europe, winning league titles with PSV Eindhoven and FC Porto, domestic honours with Sporting CP, and European trophies with Barcelona. He later revitalized Newcastle United, guiding them to UEFA Champions League qualification. Celebrated for his tactical intelligence, player development, and humility, Robson remains one of the most influential figures in modern football management.'
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Eddie',
    'Howe',
    '2022-09-01',
    true,
    true,
    true,
    'Eddie Howe is regarded as one of England''s leading modern coaches, known for his detailed tactical preparation, progressive possession-based football, and emphasis on player development. He first earned widespread acclaim by taking AFC Bournemouth from League Two to the Premier League, establishing the club in the top flight despite one of the division''s smallest budgets. After returning Bournemouth to the Premier League following an earlier spell at Burnley, Howe became manager of Newcastle United in 2021, transforming the club into Champions League qualifiers and ending a 70-year wait for a major domestic trophy by winning the EFL Cup in 2025. His coaching is characterized by structured pressing, intelligent attacking play, and a strong focus on improving individual players within a cohesive team system.'
  ),
  (
    'c0000001-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Alf',
    'Ramsey',
    '1963-02-27',
    true,
    true,
    true,
    'Sir Alf Ramsey (22 January 1920 – 28 April 1999) was one of England''s greatest football managers and the only man to lead the national team to a FIFA World Cup triumph. A dependable full-back as a player, he represented Tottenham Hotspur F.C. and England before moving into management with Ipswich Town F.C., whom he guided from the Third Division to the First Division title in just six years. Appointed England manager in February 1963, Ramsey confidently declared that England would win the 1966 World Cup, a prediction he fulfilled as his side defeated West Germany 4–2 after extra time at Wembley. Renowned for his tactical innovation, calm authority and meticulous preparation, he was knighted in 1967 for services to football and remains one of the most influential figures in the history of the English game.'
  )
on conflict (id) do update set
  club_id = excluded.club_id,
  first_name = excluded.first_name,
  second_name = excluded.second_name,
  joined_date = excluded.joined_date,
  dbs_checked = excluded.dbs_checked,
  fa_level_1 = excluded.fa_level_1,
  fa_level_2 = excluded.fa_level_2,
  biography = excluded.biography;

-- Assign coaches to teams.
insert into public.team_coaches (team_id, coach_id, role)
values
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000001',
    'Coach'
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000002',
    'Coach'
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000003',
    'Head coach'
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000004',
    'Head Coach'
  )
on conflict (team_id, coach_id) do update set
  role = excluded.role;

-- England 1966 World Cup squad.
insert into public.players (
  id,
  club_id,
  first_name,
  last_name,
  position
)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Gordon',
    'Banks',
    'GK'
  ),
  (
    'a0000001-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'George',
    'Cohen',
    'DEF'
  ),
  (
    'a0000001-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Ray',
    'Wilson',
    'DEF'
  ),
  (
    'a0000001-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Nobby',
    'Stiles',
    'MID'
  ),
  (
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'Jack',
    'Charlton',
    'DEF'
  ),
  (
    'a0000001-0000-4000-8000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'Bobby',
    'Moore',
    'DEF'
  ),
  (
    'a0000001-0000-4000-8000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'Alan',
    'Ball',
    'MID'
  ),
  (
    'a0000001-0000-4000-8000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'Bobby',
    'Charlton',
    'MID'
  ),
  (
    'a0000001-0000-4000-8000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'Geoff',
    'Hurst',
    'FWD'
  ),
  (
    'a0000001-0000-4000-8000-000000000010',
    '11111111-1111-1111-1111-111111111111',
    'Martin',
    'Peters',
    'MID'
  ),
  (
    'a0000001-0000-4000-8000-000000000011',
    '11111111-1111-1111-1111-111111111111',
    'Roger',
    'Hunt',
    'FWD'
  )
on conflict (id) do update set
  club_id = excluded.club_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  position = excluded.position;

-- Assign squad to England (shirt numbers match the 1966 World Cup final XI).
insert into public.team_players (team_id, player_id, shirt_number, active)
values
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000001',
    1,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000002',
    2,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000003',
    3,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000004',
    4,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000005',
    5,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000006',
    6,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000007',
    7,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000008',
    8,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000009',
    9,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000011',
    10,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000010',
    11,
    true
  )
on conflict (team_id, player_id) do update set
  shirt_number = excluded.shirt_number,
  active = excluded.active;

-- World Cup 1966 competition for England.
insert into public.competitions (id, team_id, name, kind)
values (
  'd0000001-0000-4000-8000-000000000001',
  'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
  'World Cup 1966',
  'cup'
)
on conflict (id) do update set
  team_id = excluded.team_id,
  name = excluded.name,
  kind = excluded.kind;

commit;
