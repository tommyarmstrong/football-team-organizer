-- Local / dev seed: club, venues, teams, managers, coaches, and players.
--
-- BEFORE RUNNING:
-- 1. Create a user in Supabase Auth (Authentication -> Users), or sign in once.
-- 2. Copy that user's UUID from the Auth users table.
-- 3. Replace the placeholder UUID below with that UUID.
--
-- Apply via Supabase SQL Editor (Dashboard -> SQL), or:
--   npx supabase db query --linked -f supabase/seed.sql
--
-- Idempotent for the fixed ids below. Re-running updates the club/venue/team/coach/player
-- rows and upserts the manager membership for the configured user.

begin;

-- Drop placeholder venue ids from earlier seed versions (if present).
delete from public.venues
where id in (
  'a0000005-0000-4000-8000-000000000005',
  'a0000006-0000-4000-8000-000000000006'
);

-- Fixed ids so re-seeding is predictable in local/dev.
with upserted_club as (
  insert into public.clubs (id, name)
  values ('11111111-1111-1111-1111-111111111111', 'The Football Association')
  on conflict (id) do update set name = excluded.name
  returning id
),
upserted_venues as (
  insert into public.venues (
    id,
    club_id,
    name,
    address_line1,
    address_line2,
    town_city,
    postcode,
    surface,
    food_and_drink
  )
  values
    (
      'a0000001-0000-4000-8000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'Aylward Academy',
      '1 Windmill Road',
      'Edmonton',
      'London',
      'N18 1NB',
      'astro'::public.venue_surface,
      array['tuck_shop', 'local_outlets']::public.venue_food_and_drink[]
    ),
    (
      'a0000002-0000-4000-8000-000000000002',
      '11111111-1111-1111-1111-111111111111',
      'St Thomas More Catholic School',
      'Glendale Avenue',
      'Wood Green',
      'London',
      'N22 5HN',
      'astro'::public.venue_surface,
      '{}'::public.venue_food_and_drink[]
    ),
    (
      'a0000003-0000-4000-8000-000000000003',
      '11111111-1111-1111-1111-111111111111',
      'Wembley Stadium',
      'Wembley Stadium',
      'Wembley',
      'London',
      'HA9 0WS',
      'grass'::public.venue_surface,
      array['cafe', 'ice_cream_van']::public.venue_food_and_drink[]
    ),
    (
      'a0000004-0000-4000-8000-000000000004',
      '11111111-1111-1111-1111-111111111111',
      'Lilleshall National Sports & Conferencing Centre',
      'Lilleshall National Sports & Conferencing Centre',
      'Near Newport',
      'Shropshire',
      'TF10 9AT',
      'grass'::public.venue_surface,
      array['bbq']::public.venue_food_and_drink[]
    )
  on conflict (id) do update set
    club_id = excluded.club_id,
    name = excluded.name,
    address_line1 = excluded.address_line1,
    address_line2 = excluded.address_line2,
    town_city = excluded.town_city,
    postcode = excluded.postcode,
    surface = excluded.surface,
    food_and_drink = excluded.food_and_drink
  returning id
),
upserted_team as (
  insert into public.teams (
    id,
    club_id,
    name,
    age_group,
    gender,
    home_venue_id,
    training_venue_id,
    training_days,
    season_label
  )
  values (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'U11 Blues',
    'U11',
    'mixed',
    'a0000001-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000002',
    array['tue', 'thu'],
    '2025/26'
  )
  on conflict (id) do update set
    club_id = excluded.club_id,
    name = excluded.name,
    age_group = excluded.age_group,
    gender = excluded.gender,
    home_venue_id = excluded.home_venue_id,
    training_venue_id = excluded.training_venue_id,
    training_days = excluded.training_days,
    season_label = excluded.season_label
  returning id
)
select 1 from upserted_club, upserted_venues, upserted_team;

-- Seed manager person + manager role (Auth UUID on people.auth_user_id).
-- Replace the Auth UUID below with your local Supabase Auth user id.
delete from public.managers
where id = '22222222-2222-2222-2222-222222222222'
   or person_id = 'p0000000-0000-4000-8000-000000000001';

delete from public.people
where id = 'p0000000-0000-4000-8000-000000000001'
   or auth_user_id = '05b5a111-bd09-440a-8613-8225e7b9397b';

insert into public.people (
  id, first_name, last_name, auth_user_id, account_status
) values (
  'p0000000-0000-4000-8000-000000000001',
  'Club',
  'Manager',
  '05b5a111-bd09-440a-8613-8225e7b9397b', -- <-- replace with your Auth user UUID
  'active'
);

insert into public.managers (id, club_id, person_id)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'p0000000-0000-4000-8000-000000000001'
);

-- Team-scoped auth roles (additive: same user may hold several roles on one team).
-- Example: management + coach + player on U11 Blues; coach only on England.
insert into public.team_members (team_id, user_id, role)
values
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid,
    'management'::public.team_role
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid,
    'coach'::public.team_role
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid,
    'player'::public.team_role
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    '05b5a111-bd09-440a-8613-8225e7b9397b'::uuid,
    'coach'::public.team_role
  )
on conflict (team_id, user_id, role) do nothing;

-- England 1966 World Cup team.
insert into public.teams (
  id,
  club_id,
  name,
  age_group,
  gender,
  home_venue_id,
  training_venue_id,
  training_days,
  season_label
)
values (
  'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'England',
  'Adults',
  'boys',
  'a0000003-0000-4000-8000-000000000003',
  'a0000004-0000-4000-8000-000000000004',
  array['mon', 'wed', 'fri'],
  '1966'
)
on conflict (id) do update set
  club_id = excluded.club_id,
  name = excluded.name,
  age_group = excluded.age_group,
  gender = excluded.gender,
  home_venue_id = excluded.home_venue_id,
  training_venue_id = excluded.training_venue_id,
  training_days = excluded.training_days,
  season_label = excluded.season_label;

-- Club coaching staff (people + role attributes).
insert into public.people (id, first_name, last_name, account_status)
values
  (
    'e0000001-0000-4000-8000-000000000001',
    'Kevin',
    'Keegan',
    'none'
  ),
  (
    'e0000001-0000-4000-8000-000000000002',
    'Bobby',
    'Robson',
    'none'
  ),
  (
    'e0000001-0000-4000-8000-000000000003',
    'Eddie',
    'Howe',
    'none'
  ),
  (
    'e0000001-0000-4000-8000-000000000004',
    'Alf',
    'Ramsey',
    'none'
  )
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.coaches (
  id,
  club_id,
  person_id,
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
    'e0000001-0000-4000-8000-000000000001',
    '2022-09-01',
    true,
    true,
    true,
    'Kevin Keegan English football''s greatest and most charismatic managers, renowned for his attacking philosophy and ability to inspire teams. He guided Newcastle United from the second tier to the Premier League and transformed them into title challengers with an exciting, free-flowing style that became known as "The Entertainers." He later won the First Division title with Manchester City, earning promotion to the Premier League, and also managed the England national team between 1999 and 2000. Keegan''s coaching legacy is defined by positive, attack-minded football, strong man-management, and his ability to galvanize clubs and supporters.'
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'e0000001-0000-4000-8000-000000000002',
    '2022-09-01',
    true,
    true,
    true,
    'Sir Bobby Robson was England''s most respected and successful football managers, enjoying a distinguished career spanning more than three decades. He led Ipswich Town to FA Cup and UEFA Cup success before taking England to the semi-finals of the 1990 FIFA World Cup. Robson also managed top clubs across Europe, winning league titles with PSV Eindhoven and FC Porto, domestic honours with Sporting CP, and European trophies with Barcelona. He later revitalized Newcastle United, guiding them to UEFA Champions League qualification. Celebrated for his tactical intelligence, player development, and humility, Robson remains one of the most influential figures in modern football management.'
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'e0000001-0000-4000-8000-000000000003',
    '2022-09-01',
    true,
    true,
    true,
    'Eddie Howe is regarded as one of England''s leading modern coaches, known for his detailed tactical preparation, progressive possession-based football, and emphasis on player development. He first earned widespread acclaim by taking AFC Bournemouth from League Two to the Premier League, establishing the club in the top flight despite one of the division''s smallest budgets. After returning Bournemouth to the Premier League following an earlier spell at Burnley, Howe became manager of Newcastle United in 2021, transforming the club into Champions League qualifiers and ending a 70-year wait for a major domestic trophy by winning the EFL Cup in 2025. His coaching is characterized by structured pressing, intelligent attacking play, and a strong focus on improving individual players within a cohesive team system.'
  ),
  (
    'c0000001-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'e0000001-0000-4000-8000-000000000004',
    '1963-02-27',
    true,
    true,
    true,
    'Sir Alf Ramsey (22 January 1920 – 28 April 1999) was one of England''s greatest football managers and the only man to lead the national team to a FIFA World Cup triumph. A dependable full-back as a player, he represented Tottenham Hotspur F.C. and England before moving into management with Ipswich Town F.C., whom he guided from the Third Division to the First Division title in just six years. Appointed England manager in February 1963, Ramsey confidently declared that England would win the 1966 World Cup, a prediction he fulfilled as his side defeated West Germany 4–2 after extra time at Wembley. Renowned for his tactical innovation, calm authority and meticulous preparation, he was knighted in 1967 for services to football and remains one of the most influential figures in the history of the English game.'
  )
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
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
    'Assistant Coach'
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000002',
    'Assistant Coach'
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000003',
    'Head Coach'
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000004',
    'Head Coach'
  )
on conflict (team_id, coach_id) do update set
  role = excluded.role;

-- England 1966 World Cup squad.
-- Players always get a people row; no login by default.
insert into public.people (id, first_name, last_name, account_status)
values
  (
    'p0000001-0000-4000-8000-000000000001',
    'Gordon',
    'Banks',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000002',
    'George',
    'Cohen',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000003',
    'Ray',
    'Wilson',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000004',
    'Nobby',
    'Stiles',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000005',
    'Jack',
    'Charlton',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000006',
    'Bobby',
    'Moore',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000007',
    'Alan',
    'Ball',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000008',
    'Bobby',
    'Charlton',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000009',
    'Geoff',
    'Hurst',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000010',
    'Martin',
    'Peters',
    'none'
  ),
  (
    'p0000001-0000-4000-8000-000000000011',
    'Roger',
    'Hunt',
    'none'
  )
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.players (
  id,
  club_id,
  person_id,
  position,
  date_of_birth
)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000001',
    'GK',
    '1937-12-30'
  ),
  (
    'a0000001-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000002',
    'DEF',
    '1939-10-22'
  ),
  (
    'a0000001-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000003',
    'DEF',
    '1934-12-17'
  ),
  (
    'a0000001-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000004',
    'MID',
    '1942-05-18'
  ),
  (
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000005',
    'DEF',
    '1935-05-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000006',
    'DEF',
    '1941-04-12'
  ),
  (
    'a0000001-0000-4000-8000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000007',
    'MID',
    '1945-05-12'
  ),
  (
    'a0000001-0000-4000-8000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000008',
    'MID',
    '1937-10-11'
  ),
  (
    'a0000001-0000-4000-8000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000009',
    'FWD',
    '1941-12-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000010',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000010',
    'MID',
    '1943-11-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000011',
    '11111111-1111-1111-1111-111111111111',
    'p0000001-0000-4000-8000-000000000011',
    'FWD',
    '1938-07-20'
  )
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  position = excluded.position,
  date_of_birth = excluded.date_of_birth;

-- Assign squad to England (1966 World Cup squad numbers).
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
    9,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000009',
    10,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000011',
    20,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000010',
    21,
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

-- England World Cup 1966 matches (all home / completed at Wembley).
-- Score is derived from goal rows.
insert into public.matches (
  id,
  team_id,
  opponent_name,
  date,
  kickoff_time,
  home_away,
  venue_id,
  competition_id,
  status,
  notes
)
values
  (
    'e0000001-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Uruguay',
    '1966-07-11',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    null
  ),
  (
    'e0000001-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Mexico',
    '1966-07-16',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    null
  ),
  (
    'e0000001-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'France',
    '1966-07-20',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    null
  ),
  (
    'e0000001-0000-4000-8000-000000000004',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Argentina',
    '1966-07-23',
    '15:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    null
  ),
  (
    'e0000001-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Portugal',
    '1966-07-26',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    null
  ),
  (
    'e0000001-0000-4000-8000-000000000006',
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'West Germany',
    '1966-07-30',
    '15:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000001',
    'played',
    'After extra time'
  )
on conflict (id) do update set
  team_id = excluded.team_id,
  opponent_name = excluded.opponent_name,
  date = excluded.date,
  kickoff_time = excluded.kickoff_time,
  home_away = excluded.home_away,
  venue_id = excluded.venue_id,
  competition_id = excluded.competition_id,
  status = excluded.status,
  notes = excluded.notes;

-- Match-day squad for the World Cup final (starting XI).
insert into public.match_players (id, match_id, player_id)
values
  (
    'a1000001-0000-4000-8000-000000000001',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000001'
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000002'
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000003'
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000004'
  ),
  (
    'a1000001-0000-4000-8000-000000000005',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000005'
  ),
  (
    'a1000001-0000-4000-8000-000000000006',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000006'
  ),
  (
    'a1000001-0000-4000-8000-000000000007',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000007'
  ),
  (
    'a1000001-0000-4000-8000-000000000008',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000008'
  ),
  (
    'a1000001-0000-4000-8000-000000000009',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009'
  ),
  (
    'a1000001-0000-4000-8000-00000000000a',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000010'
  ),
  (
    'a1000001-0000-4000-8000-00000000000b',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000011'
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id;

-- Periods for the World Cup final.
insert into public.match_periods (id, match_id, name, sort_order)
values
  (
    'a2000001-0000-4000-8000-000000000001',
    'e0000001-0000-4000-8000-000000000006',
    'Half 1',
    50
  ),
  (
    'a2000001-0000-4000-8000-000000000002',
    'e0000001-0000-4000-8000-000000000006',
    'Half 2',
    60
  ),
  (
    'a2000001-0000-4000-8000-000000000003',
    'e0000001-0000-4000-8000-000000000006',
    'Extra time 1',
    80
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- Starting XI for each period of the final (same side throughout).
delete from public.match_period_starters
where period_id in (
  'a2000001-0000-4000-8000-000000000001',
  'a2000001-0000-4000-8000-000000000002',
  'a2000001-0000-4000-8000-000000000003'
);

insert into public.match_period_starters (period_id, player_id)
select
  period_id,
  player_id
from (
  values
    ('a2000001-0000-4000-8000-000000000001'::uuid),
    ('a2000001-0000-4000-8000-000000000002'::uuid),
    ('a2000001-0000-4000-8000-000000000003'::uuid)
) as periods(period_id)
cross join (
  values
    ('a0000001-0000-4000-8000-000000000001'::uuid),
    ('a0000001-0000-4000-8000-000000000002'::uuid),
    ('a0000001-0000-4000-8000-000000000003'::uuid),
    ('a0000001-0000-4000-8000-000000000004'::uuid),
    ('a0000001-0000-4000-8000-000000000005'::uuid),
    ('a0000001-0000-4000-8000-000000000006'::uuid),
    ('a0000001-0000-4000-8000-000000000007'::uuid),
    ('a0000001-0000-4000-8000-000000000008'::uuid),
    ('a0000001-0000-4000-8000-000000000009'::uuid),
    ('a0000001-0000-4000-8000-000000000010'::uuid),
    ('a0000001-0000-4000-8000-000000000011'::uuid)
) as squad(player_id)
on conflict (period_id, player_id) do nothing;

-- England goal scorers (player ids from the 1966 squad above).
insert into public.goals (
  id,
  match_id,
  player_id,
  period_id,
  period,
  minute,
  is_opposition
)
values
  -- vs Mexico
  (
    'f0000001-0000-4000-8000-000000000001',
    'e0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    null,
    null,
    null,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000002',
    'e0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    null,
    null,
    null,
    false
  ),
  -- vs France
  (
    'f0000001-0000-4000-8000-000000000003',
    'e0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    null,
    null,
    null,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000004',
    'e0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    null,
    null,
    null,
    false
  ),
  -- vs Argentina
  (
    'f0000001-0000-4000-8000-000000000005',
    'e0000001-0000-4000-8000-000000000004',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    null,
    null,
    null,
    false
  ),
  -- vs Portugal (Bobby Charlton x2, Eusebio 1)
  (
    'f0000001-0000-4000-8000-000000000006',
    'e0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    null,
    null,
    null,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000007',
    'e0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    null,
    null,
    null,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000e',
    'e0000001-0000-4000-8000-000000000005',
    null,
    null,
    null,
    null,
    true
  ),
  -- vs West Germany (linked to periods)
  (
    'f0000001-0000-4000-8000-000000000008',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a2000001-0000-4000-8000-000000000001',
    'Half 1',
    18,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000009',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000010', -- Martin Peters
    'a2000001-0000-4000-8000-000000000002',
    'Half 2',
    78,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000a',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a2000001-0000-4000-8000-000000000003',
    'Extra time 1',
    101,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000b',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a2000001-0000-4000-8000-000000000003',
    'Extra time 1',
    120,
    false
  ),
  -- Opposition goals (West Germany)
  (
    'f0000001-0000-4000-8000-00000000000c',
    'e0000001-0000-4000-8000-000000000006',
    null,
    'a2000001-0000-4000-8000-000000000001',
    'Half 1',
    12,
    true
  ),
  (
    'f0000001-0000-4000-8000-00000000000d',
    'e0000001-0000-4000-8000-000000000006',
    null,
    'a2000001-0000-4000-8000-000000000002',
    'Half 2',
    89,
    true
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id,
  period_id = excluded.period_id,
  period = excluded.period,
  minute = excluded.minute,
  is_opposition = excluded.is_opposition;

-- Sample disciplinary cards (World Cup final + Argentina QF).
insert into public.cards (
  id,
  match_id,
  player_id,
  coach_id,
  guardian_id,
  type,
  coach_notes,
  referee_notes,
  club_notes
)
values
  (
    'ca000001-0000-4000-8000-000000000001',
    'e0000001-0000-4000-8000-000000000004', -- vs Argentina
    'a0000001-0000-4000-8000-000000000005', -- Jack Charlton
    null,
    null,
    'yellow_1st',
    'Late challenge in midfield.',
    null,
    null
  ),
  (
    'ca000001-0000-4000-8000-000000000002',
    'e0000001-0000-4000-8000-000000000006', -- vs West Germany
    null,
    'c0000001-0000-4000-8000-000000000004', -- Alf Ramsey
    null,
    'other',
    null,
    'Spoken to by referee about bench conduct.',
    'Logged for club records.'
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id,
  coach_id = excluded.coach_id,
  guardian_id = excluded.guardian_id,
  type = excluded.type,
  coach_notes = excluded.coach_notes,
  referee_notes = excluded.referee_notes,
  club_notes = excluded.club_notes;

commit;
