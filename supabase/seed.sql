-- Local / dev seed: FA club, England Men 1966 + England Women 2022.
--
-- Seeded domain data:
--   - 1 club (The Football Association)
--   - 8 venues
--   - 2 teams (England Men 1966, England Women 2022)
--   - 1 club manager (John Hall) + people row
--   - 5 coaches (Keegan, Robson, Howe, Ramsey, Wiegman) + their people rows
--   - 22 England Men players (1966 World Cup squad) + their people rows
--   - 23 England Women players (2022 Euros squad) + their people rows
--   - 2 competitions (World Cup 1966, UEFA Women's Euro 2022)
--   - 6 England Men matches (Uruguay, Mexico, France, Argentina, Portugal, West Germany)
--   - 6 England Women matches (Austria, Norway, Northern Ireland, Spain, Sweden, Germany)
--   - Match periods (halves; extra time on AET ties) linked on every match
--   - Goals with period, minute, and assist where applicable
--
-- AFTER SEEDING (initial admin):
-- 1. Create a user in Supabase Auth (Authentication -> Users), or sign in once.
-- 2. In Table Editor -> people, set John Hall's auth_user_id to that Auth user UUID
--    and account_status to 'active'. That person is already a club manager.
--
-- Apply via Supabase SQL Editor (Dashboard -> SQL), or:
--   npx supabase db query --linked -f supabase/seed.sql
--
-- Idempotent for the fixed ids below. Re-running updates seed domain rows only.
-- Manually added people/roles are left alone. people.auth_user_id is never set or
-- cleared by this file (manual Auth links survive reseed).
--
-- Seed person/role ids use UUID hex only (0-9a-f). Do not use letters outside that
-- range (e.g. p000… is invalid and will fail to insert).

begin;

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
      array['astro']::public.venue_surface[],
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
      array['astro']::public.venue_surface[],
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
      array['grass']::public.venue_surface[],
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
      array['grass']::public.venue_surface[],
      array['bbq']::public.venue_food_and_drink[]
    ),
    (
      'a0000005-0000-4000-8000-000000000005',
      '11111111-1111-1111-1111-111111111111',
      'Old Trafford',
      'Sir Matt Busby Way',
      null,
      'Manchester',
      'M16 0RA',
      array['grass']::public.venue_surface[],
      array['cafe', 'local_outlets']::public.venue_food_and_drink[]
    ),
    (
      'a0000006-0000-4000-8000-000000000006',
      '11111111-1111-1111-1111-111111111111',
      'Brighton & Hove Community Stadium',
      'Village Way',
      'Falmer',
      'Brighton',
      'BN1 9BL',
      array['grass']::public.venue_surface[],
      array['cafe', 'local_outlets']::public.venue_food_and_drink[]
    ),
    (
      'a0000007-0000-4000-8000-000000000007',
      '11111111-1111-1111-1111-111111111111',
      'St Mary''s Stadium',
      'Britannia Road',
      null,
      'Southampton',
      'SO14 5FP',
      array['grass']::public.venue_surface[],
      array['cafe', 'local_outlets']::public.venue_food_and_drink[]
    ),
    (
      'a0000008-0000-4000-8000-000000000008',
      '11111111-1111-1111-1111-111111111111',
      'Bramall Lane',
      'Bramall Lane',
      null,
      'Sheffield',
      'S2 4SU',
      array['grass']::public.venue_surface[],
      array['cafe', 'local_outlets']::public.venue_food_and_drink[]
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
upserted_teams as (
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
  values
    (
      'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
      '11111111-1111-1111-1111-111111111111',
      'England Men',
      'Adults',
      'boys',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['mon', 'wed', 'fri'],
      '1966'
    ),
    (
      'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
      '11111111-1111-1111-1111-111111111111',
      'England Women',
      'Adults',
      'girls',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['tue', 'thu'],
      '2022'
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
select 1 from upserted_club, upserted_venues, upserted_teams;

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

-- Assign club coaches to England Men (Keegan, Robson, Howe assistants; Ramsey head).
insert into public.team_coaches (team_id, coach_id, role)
values
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000001',
    'Assistant Coach'
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000002',
    'Assistant Coach'
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000003',
    'Assistant Coach'
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'c0000001-0000-4000-8000-000000000004',
    'Head Coach'
  )
on conflict (team_id, coach_id) do update set
  role = excluded.role;

-- England Men 1966 World Cup squad (full 22).
-- Players always get a people row; no login by default.
insert into public.people (id, first_name, last_name, account_status)
values
  (
    'b0000001-0000-4000-8000-000000000001',
    'Gordon',
    'Banks',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    'George',
    'Cohen',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000003',
    'Ray',
    'Wilson',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000004',
    'Nobby',
    'Stiles',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000005',
    'Jack',
    'Charlton',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000006',
    'Bobby',
    'Moore',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000007',
    'Alan',
    'Ball',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000008',
    'Bobby',
    'Charlton',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000009',
    'Geoff',
    'Hurst',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000010',
    'Martin',
    'Peters',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000011',
    'Roger',
    'Hunt',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000012',
    'Jimmy',
    'Greaves',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000013',
    'John',
    'Connelly',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000014',
    'Ron',
    'Springett',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000015',
    'Peter',
    'Bonetti',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000016',
    'Jimmy',
    'Armfield',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000017',
    'Gerry',
    'Byrne',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000018',
    'Ron',
    'Flowers',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000019',
    'Norman',
    'Hunter',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000020',
    'Terry',
    'Paine',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000021',
    'Ian',
    'Callaghan',
    'none'
  ),
  (
    'b0000001-0000-4000-8000-000000000022',
    'George',
    'Eastham',
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
    'b0000001-0000-4000-8000-000000000001',
    'GK',
    '1937-12-30'
  ),
  (
    'a0000001-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000002',
    'DEF',
    '1939-10-22'
  ),
  (
    'a0000001-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000003',
    'DEF',
    '1934-12-17'
  ),
  (
    'a0000001-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000004',
    'MID',
    '1942-05-18'
  ),
  (
    'a0000001-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000005',
    'DEF',
    '1935-05-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000006',
    'DEF',
    '1941-04-12'
  ),
  (
    'a0000001-0000-4000-8000-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000007',
    'MID',
    '1945-05-12'
  ),
  (
    'a0000001-0000-4000-8000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000008',
    'MID',
    '1937-10-11'
  ),
  (
    'a0000001-0000-4000-8000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000009',
    'FWD',
    '1941-12-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000010',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000010',
    'MID',
    '1943-11-08'
  ),
  (
    'a0000001-0000-4000-8000-000000000011',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000011',
    'FWD',
    '1938-07-20'
  ),
  (
    'a0000001-0000-4000-8000-000000000012',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000012',
    'FWD',
    '1940-02-20'
  ),
  (
    'a0000001-0000-4000-8000-000000000013',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000013',
    'FWD',
    '1938-07-18'
  ),
  (
    'a0000001-0000-4000-8000-000000000014',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000014',
    'GK',
    '1935-07-22'
  ),
  (
    'a0000001-0000-4000-8000-000000000015',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000015',
    'GK',
    '1941-09-27'
  ),
  (
    'a0000001-0000-4000-8000-000000000016',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000016',
    'DEF',
    '1935-09-21'
  ),
  (
    'a0000001-0000-4000-8000-000000000017',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000017',
    'DEF',
    '1938-08-29'
  ),
  (
    'a0000001-0000-4000-8000-000000000018',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000018',
    'MID',
    '1934-07-28'
  ),
  (
    'a0000001-0000-4000-8000-000000000019',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000019',
    'DEF',
    '1943-10-29'
  ),
  (
    'a0000001-0000-4000-8000-000000000020',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000020',
    'FWD',
    '1939-03-23'
  ),
  (
    'a0000001-0000-4000-8000-000000000021',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000021',
    'MID',
    '1942-04-10'
  ),
  (
    'a0000001-0000-4000-8000-000000000022',
    '11111111-1111-1111-1111-111111111111',
    'b0000001-0000-4000-8000-000000000022',
    'MID',
    '1936-09-23'
  )
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  position = excluded.position,
  date_of_birth = excluded.date_of_birth;

-- Assign squad to England Men (1966 World Cup squad numbers).
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
    'a0000001-0000-4000-8000-000000000012',
    8,
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
    'a0000001-0000-4000-8000-000000000013',
    11,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000014',
    12,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000015',
    13,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000016',
    14,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000017',
    15,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000010',
    16,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000018',
    17,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000019',
    18,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000020',
    19,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000021',
    20,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000011',
    21,
    true
  ),
  (
    'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
    'a0000001-0000-4000-8000-000000000022',
    22,
    true
  )
on conflict (team_id, player_id) do update set
  shirt_number = excluded.shirt_number,
  active = excluded.active;

-- World Cup 1966 competition for England Men.
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

-- England Men World Cup 1966 matches (all home / completed at Wembley).
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
-- Delete by (match_id, player_id) first so re-seed works when existing rows
-- use different primary keys (e.g. UI-created squad entries).
delete from public.match_players
where match_id = 'e0000001-0000-4000-8000-000000000006'
  and player_id in (
    'a0000001-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000004',
    'a0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000007',
    'a0000001-0000-4000-8000-000000000008',
    'a0000001-0000-4000-8000-000000000009',
    'a0000001-0000-4000-8000-000000000010',
    'a0000001-0000-4000-8000-000000000011'
  );

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

-- Periods for all England Men World Cup 1966 matches.
-- Extra time only on the final (went to AET).
insert into public.match_periods (id, match_id, name, sort_order)
values
  -- vs Uruguay
  ('a2000001-0000-4000-8000-000000000011', 'e0000001-0000-4000-8000-000000000001', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000012', 'e0000001-0000-4000-8000-000000000001', 'Second half', 60),
  -- vs Mexico
  ('a2000001-0000-4000-8000-000000000021', 'e0000001-0000-4000-8000-000000000002', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000022', 'e0000001-0000-4000-8000-000000000002', 'Second half', 60),
  -- vs France
  ('a2000001-0000-4000-8000-000000000031', 'e0000001-0000-4000-8000-000000000003', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000032', 'e0000001-0000-4000-8000-000000000003', 'Second half', 60),
  -- vs Argentina
  ('a2000001-0000-4000-8000-000000000041', 'e0000001-0000-4000-8000-000000000004', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000042', 'e0000001-0000-4000-8000-000000000004', 'Second half', 60),
  -- vs Portugal
  ('a2000001-0000-4000-8000-000000000051', 'e0000001-0000-4000-8000-000000000005', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000052', 'e0000001-0000-4000-8000-000000000005', 'Second half', 60),
  -- vs West Germany (final — AET)
  ('a2000001-0000-4000-8000-000000000001', 'e0000001-0000-4000-8000-000000000006', 'First half', 50),
  ('a2000001-0000-4000-8000-000000000002', 'e0000001-0000-4000-8000-000000000006', 'Second half', 60),
  ('a2000001-0000-4000-8000-000000000003', 'e0000001-0000-4000-8000-000000000006', 'Extra time 1', 80),
  ('a2000001-0000-4000-8000-000000000004', 'e0000001-0000-4000-8000-000000000006', 'Extra time 2', 90)
on conflict (id) do update set
  match_id = excluded.match_id,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- Starting XI for each period of the final (same side throughout).
delete from public.match_period_starters
where period_id in (
  'a2000001-0000-4000-8000-000000000001',
  'a2000001-0000-4000-8000-000000000002',
  'a2000001-0000-4000-8000-000000000003',
  'a2000001-0000-4000-8000-000000000004'
);

insert into public.match_period_starters (period_id, player_id)
select
  period_id,
  player_id
from (
  values
    ('a2000001-0000-4000-8000-000000000001'::uuid),
    ('a2000001-0000-4000-8000-000000000002'::uuid),
    ('a2000001-0000-4000-8000-000000000003'::uuid),
    ('a2000001-0000-4000-8000-000000000004'::uuid)
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

-- England Men goal scorers (player ids from the 1966 squad above).
insert into public.goals (
  id,
  match_id,
  player_id,
  assist_player_id,
  period_id,
  period,
  minute,
  is_opposition
)
values
  -- vs Mexico (2-0)
  (
    'f0000001-0000-4000-8000-000000000001',
    'e0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    null,
    'a2000001-0000-4000-8000-000000000021',
    'First half',
    38,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000002',
    'e0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    'a0000001-0000-4000-8000-000000000012', -- Jimmy Greaves
    'a2000001-0000-4000-8000-000000000022',
    'Second half',
    75,
    false
  ),
  -- vs France (2-0): Hunt x2
  (
    'f0000001-0000-4000-8000-000000000003',
    'e0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    null,
    'a2000001-0000-4000-8000-000000000031',
    'First half',
    39,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000004',
    'e0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    null,
    'a2000001-0000-4000-8000-000000000032',
    'Second half',
    76,
    false
  ),
  -- vs Argentina (1-0)
  (
    'f0000001-0000-4000-8000-000000000005',
    'e0000001-0000-4000-8000-000000000004',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a0000001-0000-4000-8000-000000000010', -- Martin Peters
    'a2000001-0000-4000-8000-000000000042',
    'Second half',
    78,
    false
  ),
  -- vs Portugal (2-1): Bobby Charlton x2, Eusebio 1
  (
    'f0000001-0000-4000-8000-000000000006',
    'e0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    'a0000001-0000-4000-8000-000000000011', -- Roger Hunt
    'a2000001-0000-4000-8000-000000000051',
    'First half',
    30,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000007',
    'e0000001-0000-4000-8000-000000000005',
    'a0000001-0000-4000-8000-000000000008', -- Bobby Charlton
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a2000001-0000-4000-8000-000000000052',
    'Second half',
    79,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000e',
    'e0000001-0000-4000-8000-000000000005',
    null,
    null,
    'a2000001-0000-4000-8000-000000000052',
    'Second half',
    82,
    true
  ),
  -- vs West Germany (4-2 aet)
  (
    'f0000001-0000-4000-8000-000000000008',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a0000001-0000-4000-8000-000000000006', -- Bobby Moore
    'a2000001-0000-4000-8000-000000000001',
    'First half',
    18,
    false
  ),
  (
    'f0000001-0000-4000-8000-000000000009',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000010', -- Martin Peters
    'a0000001-0000-4000-8000-000000000007', -- Alan Ball
    'a2000001-0000-4000-8000-000000000002',
    'Second half',
    78,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000a',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a0000001-0000-4000-8000-000000000007', -- Alan Ball
    'a2000001-0000-4000-8000-000000000003',
    'Extra time 1',
    101,
    false
  ),
  (
    'f0000001-0000-4000-8000-00000000000b',
    'e0000001-0000-4000-8000-000000000006',
    'a0000001-0000-4000-8000-000000000009', -- Geoff Hurst
    'a0000001-0000-4000-8000-000000000006', -- Bobby Moore
    'a2000001-0000-4000-8000-000000000004',
    'Extra time 2',
    120,
    false
  ),
  -- Opposition goals (West Germany)
  (
    'f0000001-0000-4000-8000-00000000000c',
    'e0000001-0000-4000-8000-000000000006',
    null,
    null,
    'a2000001-0000-4000-8000-000000000001',
    'First half',
    12,
    true
  ),
  (
    'f0000001-0000-4000-8000-00000000000d',
    'e0000001-0000-4000-8000-000000000006',
    null,
    null,
    'a2000001-0000-4000-8000-000000000002',
    'Second half',
    89,
    true
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id,
  assist_player_id = excluded.assist_player_id,
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

-- ---------------------------------------------------------------------------
-- England Women: UEFA Women's Euro 2022
-- ---------------------------------------------------------------------------

-- Head coach: Sarina Wiegman.
insert into public.people (id, first_name, last_name, account_status)
values (
  'e0000001-0000-4000-8000-000000000005',
  'Sarina',
  'Wiegman',
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
values (
  'c0000001-0000-4000-8000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'e0000001-0000-4000-8000-000000000005',
  '2021-09-01',
  true,
  true,
  true,
  'Sarina Wiegman (born 26 October 1969) is a Dutch football manager and former player who has managed the England women''s national team since September 2021. She led the Lionesses to victory at UEFA Women''s Euro 2022 on home soil — England''s first major senior trophy since 1966 — becoming the first coach to win the Women''s Euros with two different nations after guiding the Netherlands to the 2017 title. A former Netherlands midfielder and centurion, she later managed ADO Den Haag and her national team, taking the Dutch to the 2019 World Cup final. Widely regarded as one of the leading coaches in the women''s game, she has been named The Best FIFA Women''s Coach on multiple occasions and was appointed an Honorary CBE for services to football.'
)
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  joined_date = excluded.joined_date,
  dbs_checked = excluded.dbs_checked,
  fa_level_1 = excluded.fa_level_1,
  fa_level_2 = excluded.fa_level_2,
  biography = excluded.biography;

insert into public.team_coaches (team_id, coach_id, role)
values (
  'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
  'c0000001-0000-4000-8000-000000000005',
  'Head Coach'
)
on conflict (team_id, coach_id) do update set
  role = excluded.role;

-- England Women 2022 Euros squad (23).
insert into public.people (id, first_name, last_name, account_status)
values
  ('b0000002-0000-4000-8000-000000000001', 'Mary', 'Earps', 'none'),
  ('b0000002-0000-4000-8000-000000000002', 'Lucy', 'Bronze', 'none'),
  ('b0000002-0000-4000-8000-000000000003', 'Rachel', 'Daly', 'none'),
  ('b0000002-0000-4000-8000-000000000004', 'Keira', 'Walsh', 'none'),
  ('b0000002-0000-4000-8000-000000000005', 'Alex', 'Greenwood', 'none'),
  ('b0000002-0000-4000-8000-000000000006', 'Millie', 'Bright', 'none'),
  ('b0000002-0000-4000-8000-000000000007', 'Beth', 'Mead', 'none'),
  ('b0000002-0000-4000-8000-000000000008', 'Leah', 'Williamson', 'none'),
  ('b0000002-0000-4000-8000-000000000009', 'Ellen', 'White', 'none'),
  ('b0000002-0000-4000-8000-000000000010', 'Georgia', 'Stanway', 'none'),
  ('b0000002-0000-4000-8000-000000000011', 'Lauren', 'Hemp', 'none'),
  ('b0000002-0000-4000-8000-000000000012', 'Jess', 'Carter', 'none'),
  ('b0000002-0000-4000-8000-000000000013', 'Hannah', 'Hampton', 'none'),
  ('b0000002-0000-4000-8000-000000000014', 'Fran', 'Kirby', 'none'),
  ('b0000002-0000-4000-8000-000000000015', 'Demi', 'Stokes', 'none'),
  ('b0000002-0000-4000-8000-000000000016', 'Jill', 'Scott', 'none'),
  ('b0000002-0000-4000-8000-000000000017', 'Nikita', 'Parris', 'none'),
  ('b0000002-0000-4000-8000-000000000018', 'Chloe', 'Kelly', 'none'),
  ('b0000002-0000-4000-8000-000000000019', 'Bethany', 'England', 'none'),
  ('b0000002-0000-4000-8000-000000000020', 'Ella', 'Toone', 'none'),
  ('b0000002-0000-4000-8000-000000000021', 'Ellie', 'Roebuck', 'none'),
  ('b0000002-0000-4000-8000-000000000022', 'Lotte', 'Wubben-Moy', 'none'),
  ('b0000002-0000-4000-8000-000000000023', 'Alessia', 'Russo', 'none')
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
  ('a0000002-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000001', 'GK', '1993-03-07'),
  ('a0000002-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000002', 'DEF', '1991-10-28'),
  ('a0000002-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000003', 'DEF', '1991-12-06'),
  ('a0000002-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000004', 'MID', '1997-04-08'),
  ('a0000002-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000005', 'DEF', '1993-09-07'),
  ('a0000002-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000006', 'DEF', '1993-08-21'),
  ('a0000002-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000007', 'FWD', '1995-05-09'),
  ('a0000002-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000008', 'DEF', '1997-03-29'),
  ('a0000002-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000009', 'FWD', '1989-05-09'),
  ('a0000002-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000010', 'MID', '1999-01-03'),
  ('a0000002-0000-4000-8000-000000000011', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000011', 'FWD', '2000-08-07'),
  ('a0000002-0000-4000-8000-000000000012', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000012', 'DEF', '1997-10-17'),
  ('a0000002-0000-4000-8000-000000000013', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000013', 'GK', '2000-11-16'),
  ('a0000002-0000-4000-8000-000000000014', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000014', 'MID', '1993-06-29'),
  ('a0000002-0000-4000-8000-000000000015', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000015', 'DEF', '1991-12-12'),
  ('a0000002-0000-4000-8000-000000000016', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000016', 'MID', '1987-02-02'),
  ('a0000002-0000-4000-8000-000000000017', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000017', 'FWD', '1994-03-10'),
  ('a0000002-0000-4000-8000-000000000018', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000018', 'FWD', '1998-01-15'),
  ('a0000002-0000-4000-8000-000000000019', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000019', 'FWD', '1994-06-03'),
  ('a0000002-0000-4000-8000-000000000020', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000020', 'MID', '1999-09-02'),
  ('a0000002-0000-4000-8000-000000000021', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000021', 'GK', '1999-09-23'),
  ('a0000002-0000-4000-8000-000000000022', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000022', 'DEF', '1999-01-11'),
  ('a0000002-0000-4000-8000-000000000023', '11111111-1111-1111-1111-111111111111', 'b0000002-0000-4000-8000-000000000023', 'FWD', '1999-02-08')
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  position = excluded.position,
  date_of_birth = excluded.date_of_birth;

insert into public.team_players (team_id, player_id, shirt_number, active)
values
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000001', 1, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000002', 2, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000003', 3, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000004', 4, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000005', 5, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000006', 6, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000007', 7, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000008', 8, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000009', 9, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000010', 10, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000011', 11, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000012', 12, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000013', 13, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000014', 14, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000015', 15, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000016', 16, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000017', 17, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000018', 18, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000019', 19, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000020', 20, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000021', 21, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000022', 22, true),
  ('bbbbbbbb-bbbb-cccc-dddd-ffffffffffff', 'a0000002-0000-4000-8000-000000000023', 23, true)
on conflict (team_id, player_id) do update set
  shirt_number = excluded.shirt_number,
  active = excluded.active;

-- UEFA Women's Euro 2022 competition for England Women.
insert into public.competitions (
  id,
  team_id,
  name,
  kind,
  season,
  knockout,
  age_group,
  gender,
  players_per_team,
  periods,
  minutes_per_period
)
values (
  'd0000001-0000-4000-8000-000000000002',
  'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
  'UEFA Women''s Euro 2022',
  'cup',
  '2022',
  true,
  'Adults',
  'female',
  11,
  '2',
  45
)
on conflict (id) do update set
  team_id = excluded.team_id,
  name = excluded.name,
  kind = excluded.kind,
  season = excluded.season,
  knockout = excluded.knockout,
  age_group = excluded.age_group,
  gender = excluded.gender,
  players_per_team = excluded.players_per_team,
  periods = excluded.periods,
  minutes_per_period = excluded.minutes_per_period;

-- England Women Euro 2022 matches (tournament venues linked).
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
    'e0000002-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Austria',
    '2022-07-06',
    '20:00',
    'home',
    'a0000005-0000-4000-8000-000000000005',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Group A — Old Trafford'
  ),
  (
    'e0000002-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Norway',
    '2022-07-11',
    '20:00',
    'home',
    'a0000006-0000-4000-8000-000000000006',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Group A — Brighton & Hove Community Stadium'
  ),
  (
    'e0000002-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Northern Ireland',
    '2022-07-15',
    '20:00',
    'away',
    'a0000007-0000-4000-8000-000000000007',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Group A — St Mary''s Stadium'
  ),
  (
    'e0000002-0000-4000-8000-000000000004',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Spain',
    '2022-07-20',
    '20:00',
    'home',
    'a0000006-0000-4000-8000-000000000006',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Quarter-final — after extra time — Brighton & Hove Community Stadium'
  ),
  (
    'e0000002-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Sweden',
    '2022-07-26',
    '20:00',
    'home',
    'a0000008-0000-4000-8000-000000000008',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Semi-final — Bramall Lane'
  ),
  (
    'e0000002-0000-4000-8000-000000000006',
    'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
    'Germany',
    '2022-07-31',
    '17:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000002',
    'played',
    'Final — after extra time'
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

-- Periods for all England Women Euro 2022 matches.
-- Extra time on the Spain QF and Germany final (both AET).
insert into public.match_periods (id, match_id, name, sort_order)
values
  -- vs Austria
  ('a2000002-0000-4000-8000-000000000011', 'e0000002-0000-4000-8000-000000000001', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000012', 'e0000002-0000-4000-8000-000000000001', 'Second half', 60),
  -- vs Norway
  ('a2000002-0000-4000-8000-000000000021', 'e0000002-0000-4000-8000-000000000002', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000022', 'e0000002-0000-4000-8000-000000000002', 'Second half', 60),
  -- vs Northern Ireland
  ('a2000002-0000-4000-8000-000000000031', 'e0000002-0000-4000-8000-000000000003', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000032', 'e0000002-0000-4000-8000-000000000003', 'Second half', 60),
  -- vs Spain (QF — AET)
  ('a2000002-0000-4000-8000-000000000041', 'e0000002-0000-4000-8000-000000000004', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000042', 'e0000002-0000-4000-8000-000000000004', 'Second half', 60),
  ('a2000002-0000-4000-8000-000000000043', 'e0000002-0000-4000-8000-000000000004', 'Extra time 1', 80),
  ('a2000002-0000-4000-8000-000000000044', 'e0000002-0000-4000-8000-000000000004', 'Extra time 2', 90),
  -- vs Sweden
  ('a2000002-0000-4000-8000-000000000051', 'e0000002-0000-4000-8000-000000000005', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000052', 'e0000002-0000-4000-8000-000000000005', 'Second half', 60),
  -- vs Germany (final — AET)
  ('a2000002-0000-4000-8000-000000000061', 'e0000002-0000-4000-8000-000000000006', 'First half', 50),
  ('a2000002-0000-4000-8000-000000000062', 'e0000002-0000-4000-8000-000000000006', 'Second half', 60),
  ('a2000002-0000-4000-8000-000000000063', 'e0000002-0000-4000-8000-000000000006', 'Extra time 1', 80),
  ('a2000002-0000-4000-8000-000000000064', 'e0000002-0000-4000-8000-000000000006', 'Extra time 2', 90)
on conflict (id) do update set
  match_id = excluded.match_id,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- England Women goal scorers (Euro 2022).
insert into public.goals (
  id,
  match_id,
  player_id,
  assist_player_id,
  period_id,
  period,
  minute,
  is_opposition,
  is_own_goal
)
values
  -- vs Austria (1-0): Mead
  (
    'f0000002-0000-4000-8000-000000000001',
    'e0000002-0000-4000-8000-000000000001',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a0000002-0000-4000-8000-000000000014', -- Fran Kirby
    'a2000002-0000-4000-8000-000000000011',
    'First half',
    16,
    false,
    false
  ),
  -- vs Norway (8-0): Stanway, Hemp, White x2, Mead x3, Russo
  (
    'f0000002-0000-4000-8000-000000000002',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000010', -- Georgia Stanway (pen)
    null,
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    12,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000003',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000011', -- Lauren Hemp
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    15,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000004',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000009', -- Ellen White
    null,
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    28,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000005',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a0000002-0000-4000-8000-000000000011', -- Lauren Hemp
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    34,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000006',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    null,
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    38,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000007',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000009', -- Ellen White
    'a0000002-0000-4000-8000-000000000014', -- Fran Kirby
    'a2000002-0000-4000-8000-000000000021',
    'First half',
    41,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000008',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000023', -- Alessia Russo
    'a0000002-0000-4000-8000-000000000002', -- Lucy Bronze
    'a2000002-0000-4000-8000-000000000022',
    'Second half',
    66,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000009',
    'e0000002-0000-4000-8000-000000000002',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    null,
    'a2000002-0000-4000-8000-000000000022',
    'Second half',
    81,
    false,
    false
  ),
  -- vs Northern Ireland (5-0): Kirby, Mead, Russo x2, OG
  (
    'f0000002-0000-4000-8000-00000000000a',
    'e0000002-0000-4000-8000-000000000003',
    'a0000002-0000-4000-8000-000000000014', -- Fran Kirby
    null,
    'a2000002-0000-4000-8000-000000000031',
    'First half',
    40,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-00000000000b',
    'e0000002-0000-4000-8000-000000000003',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    null,
    'a2000002-0000-4000-8000-000000000031',
    'First half',
    44,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-00000000000c',
    'e0000002-0000-4000-8000-000000000003',
    'a0000002-0000-4000-8000-000000000023', -- Alessia Russo
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a2000002-0000-4000-8000-000000000032',
    'Second half',
    48,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-00000000000d',
    'e0000002-0000-4000-8000-000000000003',
    'a0000002-0000-4000-8000-000000000023', -- Alessia Russo
    'a0000002-0000-4000-8000-000000000020', -- Ella Toone
    'a2000002-0000-4000-8000-000000000032',
    'Second half',
    53,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-00000000000e',
    'e0000002-0000-4000-8000-000000000003',
    null,
    null,
    'a2000002-0000-4000-8000-000000000032',
    'Second half',
    76,
    false,
    true
  ),
  -- vs Spain (2-1 aet): opposition, Toone, Stanway
  (
    'f0000002-0000-4000-8000-00000000000f',
    'e0000002-0000-4000-8000-000000000004',
    null,
    null,
    'a2000002-0000-4000-8000-000000000042',
    'Second half',
    54,
    true,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000010',
    'e0000002-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000020', -- Ella Toone
    'a0000002-0000-4000-8000-000000000023', -- Alessia Russo
    'a2000002-0000-4000-8000-000000000042',
    'Second half',
    84,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000011',
    'e0000002-0000-4000-8000-000000000004',
    'a0000002-0000-4000-8000-000000000010', -- Georgia Stanway
    'a0000002-0000-4000-8000-000000000004', -- Keira Walsh
    'a2000002-0000-4000-8000-000000000043',
    'Extra time 1',
    96,
    false,
    false
  ),
  -- vs Sweden (4-0): Mead, Bronze, Russo, Kirby
  (
    'f0000002-0000-4000-8000-000000000012',
    'e0000002-0000-4000-8000-000000000005',
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a0000002-0000-4000-8000-000000000002', -- Lucy Bronze
    'a2000002-0000-4000-8000-000000000051',
    'First half',
    34,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000013',
    'e0000002-0000-4000-8000-000000000005',
    'a0000002-0000-4000-8000-000000000002', -- Lucy Bronze
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a2000002-0000-4000-8000-000000000052',
    'Second half',
    48,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000014',
    'e0000002-0000-4000-8000-000000000005',
    'a0000002-0000-4000-8000-000000000023', -- Alessia Russo
    'a0000002-0000-4000-8000-000000000014', -- Fran Kirby
    'a2000002-0000-4000-8000-000000000052',
    'Second half',
    68,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000015',
    'e0000002-0000-4000-8000-000000000005',
    'a0000002-0000-4000-8000-000000000014', -- Fran Kirby
    'a0000002-0000-4000-8000-000000000007', -- Beth Mead
    'a2000002-0000-4000-8000-000000000052',
    'Second half',
    76,
    false,
    false
  ),
  -- vs Germany (2-1 aet): Toone, opposition, Kelly
  (
    'f0000002-0000-4000-8000-000000000016',
    'e0000002-0000-4000-8000-000000000006',
    'a0000002-0000-4000-8000-000000000020', -- Ella Toone
    'a0000002-0000-4000-8000-000000000004', -- Keira Walsh
    'a2000002-0000-4000-8000-000000000062',
    'Second half',
    62,
    false,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000017',
    'e0000002-0000-4000-8000-000000000006',
    null,
    null,
    'a2000002-0000-4000-8000-000000000062',
    'Second half',
    79,
    true,
    false
  ),
  (
    'f0000002-0000-4000-8000-000000000018',
    'e0000002-0000-4000-8000-000000000006',
    'a0000002-0000-4000-8000-000000000018', -- Chloe Kelly
    null,
    'a2000002-0000-4000-8000-000000000064',
    'Extra time 2',
    110,
    false,
    false
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id,
  assist_player_id = excluded.assist_player_id,
  period_id = excluded.period_id,
  period = excluded.period,
  minute = excluded.minute,
  is_opposition = excluded.is_opposition,
  is_own_goal = excluded.is_own_goal;

commit;
