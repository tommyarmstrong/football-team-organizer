-- Local / dev seed: FA club + England Men (1965/66, 1995/96, 2025/26) + England Women 2021/22.
--
-- Seeded domain data:
--   - 1 club (The Football Association)
--   - 32 venues (training/national + 2025/26 Premier League stadiums + WC 2026 tournament venues)
--   - 4 teams (England Men 1965/66, England Men 1995/96, England Men 2025/26, England Women 2021/22)
--   - 1 club manager (John Hall) + people row
--   - 7 coaches (Keegan, Robson, Howe, Ramsey, Wiegman, Venables, Tuchel) + their people rows
--   - 22 England Men players (1966 World Cup squad) + their people rows
--   - 22 England Men players (Euro 96 squad) + their people rows
--   - 26 England Men players (World Cup 2026 squad) + their people rows
--   - 23 England Women players (2022 Euros squad) + their people rows
--   - 4 competitions (World Cup 1965/66, Euro 96, World Cup 2025/26, UEFA Women's Euro 2021/22)
--   - 6 England Men 1966 matches (Uruguay, Mexico, France, Argentina, Portugal, West Germany)
--   - 5 England Men Euro 96 matches (Switzerland, Scotland, Netherlands, Spain, Germany) — historical
--   - 8 England Men World Cup 2026 matches (Croatia, Ghana, Panama, DR Congo, Mexico, Norway,
--     Argentina, France) — group + knockout through QF historical/reported; SF + final projected
--   - 6 England Women matches (Austria, Norway, Northern Ireland, Spain, Sweden, Germany)
--   - Match periods (halves; extra time on AET ties) linked on every match
--   - Goals with period, minute, and assist where applicable
--   - Sample disciplinary cards on selected fixtures
--   - Coach's player of the match on England Women Euro 2022 fixtures (UEFA POTM)
--
-- Historical vs projected (World Cup 2026):
--   Historical / publicly reported: Tuchel; 26-man squad (Chalobah #12 after Livramento injury);
--   Group L results; R32/R16/QF results and venues.
--   Counterfactual (seed requires result = champions): SF win vs Argentina and final win vs France.
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
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000006-0000-4000-8000-000000000006',
      '11111111-1111-1111-1111-111111111111',
      'American Express Stadium',
      'Village Way',
      'Falmer',
      'Brighton',
      'BN1 9BL',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
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
    ),
    (
      'a0000009-0000-4000-8000-000000000009',
      '11111111-1111-1111-1111-111111111111',
      'Emirates Stadium',
      'Hornsey Road',
      null,
      'London',
      'N7 7AJ',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000010-0000-4000-8000-000000000010',
      '11111111-1111-1111-1111-111111111111',
      'Villa Park',
      'Trinity Road',
      null,
      'Birmingham',
      'B6 6HE',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000011-0000-4000-8000-000000000011',
      '11111111-1111-1111-1111-111111111111',
      'Vitality Stadium',
      'Kings Park',
      null,
      'Bournemouth',
      'BH7 7AF',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000012-0000-4000-8000-000000000012',
      '11111111-1111-1111-1111-111111111111',
      'Gtech Community Stadium',
      'Lionel Road South',
      null,
      'Brentford',
      'TW8 0RU',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000013-0000-4000-8000-000000000013',
      '11111111-1111-1111-1111-111111111111',
      'Turf Moor',
      'Harry Potts Way',
      null,
      'Burnley',
      'BB10 4BX',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000014-0000-4000-8000-000000000014',
      '11111111-1111-1111-1111-111111111111',
      'Stamford Bridge',
      'Fulham Road',
      null,
      'London',
      'SW6 1HS',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000015-0000-4000-8000-000000000015',
      '11111111-1111-1111-1111-111111111111',
      'Selhurst Park',
      'Selhurst Road',
      null,
      'London',
      'SE25 6PU',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000016-0000-4000-8000-000000000016',
      '11111111-1111-1111-1111-111111111111',
      'Hill Dickinson Stadium',
      'Regent Road',
      null,
      'Liverpool',
      'L3 0BW',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000017-0000-4000-8000-000000000017',
      '11111111-1111-1111-1111-111111111111',
      'Craven Cottage',
      'Stevenage Road',
      null,
      'London',
      'SW6 6HH',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000018-0000-4000-8000-000000000018',
      '11111111-1111-1111-1111-111111111111',
      'Elland Road',
      'Elland Road',
      null,
      'Leeds',
      'LS11 0ES',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000019-0000-4000-8000-000000000019',
      '11111111-1111-1111-1111-111111111111',
      'Anfield',
      'Anfield Road',
      null,
      'Liverpool',
      'L4 0TH',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000020-0000-4000-8000-000000000020',
      '11111111-1111-1111-1111-111111111111',
      'Etihad Stadium',
      'Ashton New Road',
      null,
      'Manchester',
      'M11 3FF',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000021-0000-4000-8000-000000000021',
      '11111111-1111-1111-1111-111111111111',
      'St James'' Park',
      'Strawberry Place',
      null,
      'Newcastle upon Tyne',
      'NE1 4ST',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000022-0000-4000-8000-000000000022',
      '11111111-1111-1111-1111-111111111111',
      'City Ground',
      'Pavilion Road',
      null,
      'West Bridgford',
      'NG2 5FJ',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000023-0000-4000-8000-000000000023',
      '11111111-1111-1111-1111-111111111111',
      'Stadium of Light',
      'Stadium Way',
      null,
      'Sunderland',
      'SR5 1SU',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000024-0000-4000-8000-000000000024',
      '11111111-1111-1111-1111-111111111111',
      'Tottenham Hotspur Stadium',
      'High Road',
      'Tottenham',
      'London',
      'N17 0BX',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000025-0000-4000-8000-000000000025',
      '11111111-1111-1111-1111-111111111111',
      'London Stadium',
      'Queen Elizabeth Olympic Park',
      'Stratford',
      'London',
      'E20 2ST',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000026-0000-4000-8000-000000000026',
      '11111111-1111-1111-1111-111111111111',
      'Molineux Stadium',
      'Waterloo Road',
      null,
      'Wolverhampton',
      'WV1 4QR',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000027-0000-4000-8000-000000000027',
      '11111111-1111-1111-1111-111111111111',
      'AT&T Stadium',
      '1 AT&T Way',
      null,
      'Arlington',
      'TX 76011',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000028-0000-4000-8000-000000000028',
      '11111111-1111-1111-1111-111111111111',
      'Gillette Stadium',
      '1 Patriot Place',
      null,
      'Foxborough',
      'MA 02035',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000029-0000-4000-8000-000000000029',
      '11111111-1111-1111-1111-111111111111',
      'MetLife Stadium',
      '1 MetLife Stadium Drive',
      null,
      'East Rutherford',
      'NJ 07073',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000030-0000-4000-8000-000000000030',
      '11111111-1111-1111-1111-111111111111',
      'Mercedes-Benz Stadium',
      '1 AMB Drive NW',
      null,
      'Atlanta',
      'GA 30313',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000031-0000-4000-8000-000000000031',
      '11111111-1111-1111-1111-111111111111',
      'Estadio Azteca',
      'Calzada de Tlalpan 3465',
      'Santa Ursula Coapa',
      'Mexico City',
      '04650',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
    ),
    (
      'a0000032-0000-4000-8000-000000000032',
      '11111111-1111-1111-1111-111111111111',
      'Hard Rock Stadium',
      '347 Don Shula Drive',
      null,
      'Miami Gardens',
      'FL 33056',
      array['grass']::public.venue_surface[],
      array['cafe', 'bar', 'toilets', 'rain_shelter']::public.venue_food_and_drink[]
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
    display_name,
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
      'England',
      'Adults',
      'men',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['mon', 'wed', 'fri'],
      '1965/66'
    ),
    (
      'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
      '11111111-1111-1111-1111-111111111111',
      'England Women',
      'England',
      'Adults',
      'women',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['tue', 'thu'],
      '2021/22'
    ),
    (
      'bbbbbbbb-bbbb-cccc-dddd-000000000096',
      '11111111-1111-1111-1111-111111111111',
      'England Men',
      'England',
      'Adults',
      'men',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['mon', 'wed', 'fri'],
      '1995/96'
    ),
    (
      'bbbbbbbb-bbbb-cccc-dddd-000000002026',
      '11111111-1111-1111-1111-111111111111',
      'England Men',
      'England',
      'Adults',
      'men',
      'a0000003-0000-4000-8000-000000000003',
      'a0000004-0000-4000-8000-000000000004',
      array['mon', 'wed', 'fri'],
      '2025/26'
    )
  on conflict (id) do update set
    club_id = excluded.club_id,
    name = excluded.name,
    display_name = excluded.display_name,
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

-- World Cup 1965/66 competition for England Men.
insert into public.competitions (
  id,
  team_id,
  name,
  kind,
  season,
  result,
  venue_mode,
  venue_id
)
values (
  'd0000001-0000-4000-8000-000000000001',
  'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
  'World Cup',
  'cup',
  '1965/66',
  'champions',
  'multiple',
  null
)
on conflict (id) do update set
  team_id = excluded.team_id,
  name = excluded.name,
  kind = excluded.kind,
  season = excluded.season,
  result = excluded.result,
  venue_mode = excluded.venue_mode,
  venue_id = excluded.venue_id;

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
-- Remove any prior periods for these matches (e.g. UI-created duplicates)
-- so re-seed keeps a single canonical set.
delete from public.match_periods
where match_id in (
  'e0000001-0000-4000-8000-000000000001',
  'e0000001-0000-4000-8000-000000000002',
  'e0000001-0000-4000-8000-000000000003',
  'e0000001-0000-4000-8000-000000000004',
  'e0000001-0000-4000-8000-000000000005',
  'e0000001-0000-4000-8000-000000000006'
);

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

-- UEFA Women's Euro 2021/22 competition for England Women.
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
  minutes_per_period,
  result,
  venue_mode,
  venue_id
)
values (
  'd0000001-0000-4000-8000-000000000002',
  'bbbbbbbb-bbbb-cccc-dddd-ffffffffffff',
  'Women''s Euros',
  'cup',
  '2021/22',
  true,
  'Adults',
  'female',
  11,
  '2',
  45,
  'champions',
  'multiple',
  null
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
  minutes_per_period = excluded.minutes_per_period,
  result = excluded.result,
  venue_mode = excluded.venue_mode,
  venue_id = excluded.venue_id;

-- England Women Euro 2022 matches (tournament venues linked).
-- Coach's player of the match = UEFA Technical Observers' official POTM.
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
  notes,
  player_of_the_match_id
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
    'Group A — Old Trafford',
    'a0000002-0000-4000-8000-000000000010' -- Georgia Stanway
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
    'Group A — Brighton & Hove Community Stadium',
    'a0000002-0000-4000-8000-000000000007' -- Beth Mead
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
    'Group A — St Mary''s Stadium',
    'a0000002-0000-4000-8000-000000000023' -- Alessia Russo
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
    'Quarter-final — after extra time — Brighton & Hove Community Stadium',
    'a0000002-0000-4000-8000-000000000006' -- Millie Bright
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
    'Semi-final — Bramall Lane',
    'a0000002-0000-4000-8000-000000000007' -- Beth Mead
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
    'Final — after extra time',
    'a0000002-0000-4000-8000-000000000004' -- Keira Walsh
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
  notes = excluded.notes,
  player_of_the_match_id = excluded.player_of_the_match_id;

-- Periods for all England Women Euro 2022 matches.
-- Extra time on the Spain QF and Germany final (both AET).
-- Remove any prior periods for these matches (e.g. UI-created duplicates)
-- so re-seed keeps a single canonical set.
delete from public.match_periods
where match_id in (
  'e0000002-0000-4000-8000-000000000001',
  'e0000002-0000-4000-8000-000000000002',
  'e0000002-0000-4000-8000-000000000003',
  'e0000002-0000-4000-8000-000000000004',
  'e0000002-0000-4000-8000-000000000005',
  'e0000002-0000-4000-8000-000000000006'
);

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

-- ---------------------------------------------------------------------------
-- England Men: UEFA Euro 1996 (historical)
-- ---------------------------------------------------------------------------
-- Historical: squad, Terry Venables, all five England matches at Wembley,
-- goals, and semi-final exit to Germany on penalties. Competition result:
-- semi_final.

-- Head coach: Terry Venables.
insert into public.people (id, first_name, last_name, account_status)
values (
  'e0000001-0000-4000-8000-000000000006',
  'Terry',
  'Venables',
  'none'
)
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.coaches (
  id, club_id, person_id, joined_date, dbs_checked, fa_level_1, fa_level_2, biography
)
values (
  'c0000001-0000-4000-8000-000000000006',
  '11111111-1111-1111-1111-111111111111',
  'e0000001-0000-4000-8000-000000000006',
  '1994-01-28',
  true, true, true,
  'Terry Venables (born 6 January 1943) managed England from 1994 to 1996 and led the hosts at UEFA Euro 1996. A former Chelsea, Tottenham and Barcelona player and coach, he guided England to the semi-finals on home soil before a penalty shoot-out defeat to Germany at Wembley. Known for tactical flexibility and man-management, Venables remains closely associated with the Euro 96 summer.'
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
  'bbbbbbbb-bbbb-cccc-dddd-000000000096',
  'c0000001-0000-4000-8000-000000000006',
  'Head Coach'
)
on conflict (team_id, coach_id) do update set role = excluded.role;

-- England Men Euro 96 squad (full 22).
insert into public.people (id, first_name, last_name, account_status)
values
  ('b0000003-0000-4000-8000-000000000001', 'David', 'Seaman', 'none'),
  ('b0000003-0000-4000-8000-000000000002', 'Gary', 'Neville', 'none'),
  ('b0000003-0000-4000-8000-000000000003', 'Stuart', 'Pearce', 'none'),
  ('b0000003-0000-4000-8000-000000000004', 'Paul', 'Ince', 'none'),
  ('b0000003-0000-4000-8000-000000000005', 'Tony', 'Adams', 'none'),
  ('b0000003-0000-4000-8000-000000000006', 'Gareth', 'Southgate', 'none'),
  ('b0000003-0000-4000-8000-000000000007', 'David', 'Platt', 'none'),
  ('b0000003-0000-4000-8000-000000000008', 'Paul', 'Gascoigne', 'none'),
  ('b0000003-0000-4000-8000-000000000009', 'Alan', 'Shearer', 'none'),
  ('b0000003-0000-4000-8000-000000000010', 'Teddy', 'Sheringham', 'none'),
  ('b0000003-0000-4000-8000-000000000011', 'Darren', 'Anderton', 'none'),
  ('b0000003-0000-4000-8000-000000000012', 'Steve', 'Howey', 'none'),
  ('b0000003-0000-4000-8000-000000000013', 'Tim', 'Flowers', 'none'),
  ('b0000003-0000-4000-8000-000000000014', 'Nick', 'Barmby', 'none'),
  ('b0000003-0000-4000-8000-000000000015', 'Jamie', 'Redknapp', 'none'),
  ('b0000003-0000-4000-8000-000000000016', 'Sol', 'Campbell', 'none'),
  ('b0000003-0000-4000-8000-000000000017', 'Steve', 'McManaman', 'none'),
  ('b0000003-0000-4000-8000-000000000018', 'Les', 'Ferdinand', 'none'),
  ('b0000003-0000-4000-8000-000000000019', 'Phil', 'Neville', 'none'),
  ('b0000003-0000-4000-8000-000000000020', 'Steve', 'Stone', 'none'),
  ('b0000003-0000-4000-8000-000000000021', 'Robbie', 'Fowler', 'none'),
  ('b0000003-0000-4000-8000-000000000022', 'Ian', 'Walker', 'none')
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.players (id, club_id, person_id, position, date_of_birth)
values
  ('a0000003-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000001', 'GK', '1963-09-19'),
  ('a0000003-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000002', 'DEF', '1975-02-18'),
  ('a0000003-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000003', 'DEF', '1962-04-24'),
  ('a0000003-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000004', 'MID', '1967-10-21'),
  ('a0000003-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000005', 'DEF', '1966-10-10'),
  ('a0000003-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000006', 'DEF', '1970-09-03'),
  ('a0000003-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000007', 'MID', '1966-06-10'),
  ('a0000003-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000008', 'MID', '1967-05-27'),
  ('a0000003-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000009', 'FWD', '1970-08-13'),
  ('a0000003-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000010', 'FWD', '1966-04-02'),
  ('a0000003-0000-4000-8000-000000000011', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000011', 'MID', '1972-03-03'),
  ('a0000003-0000-4000-8000-000000000012', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000012', 'DEF', '1971-10-26'),
  ('a0000003-0000-4000-8000-000000000013', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000013', 'GK', '1967-02-03'),
  ('a0000003-0000-4000-8000-000000000014', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000014', 'MID', '1974-02-11'),
  ('a0000003-0000-4000-8000-000000000015', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000015', 'MID', '1973-06-25'),
  ('a0000003-0000-4000-8000-000000000016', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000016', 'DEF', '1974-09-18'),
  ('a0000003-0000-4000-8000-000000000017', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000017', 'MID', '1972-02-11'),
  ('a0000003-0000-4000-8000-000000000018', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000018', 'FWD', '1966-12-08'),
  ('a0000003-0000-4000-8000-000000000019', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000019', 'DEF', '1977-01-21'),
  ('a0000003-0000-4000-8000-000000000020', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000020', 'MID', '1971-08-20'),
  ('a0000003-0000-4000-8000-000000000021', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000021', 'FWD', '1975-04-09'),
  ('a0000003-0000-4000-8000-000000000022', '11111111-1111-1111-1111-111111111111', 'b0000003-0000-4000-8000-000000000022', 'GK', '1971-10-31')
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  position = excluded.position,
  date_of_birth = excluded.date_of_birth;

insert into public.team_players (team_id, player_id, shirt_number, active)
values
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000001', 1, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000002', 2, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000003', 3, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000004', 4, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000005', 5, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000006', 6, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000007', 7, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000008', 8, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000009', 9, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000010', 10, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000011', 11, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000012', 12, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000013', 13, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000014', 14, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000015', 15, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000016', 16, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000017', 17, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000018', 18, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000019', 19, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000020', 20, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000021', 21, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000000096', 'a0000003-0000-4000-8000-000000000022', 22, true)
on conflict (team_id, player_id) do update set
  shirt_number = excluded.shirt_number,
  active = excluded.active;

-- Euro 96 competition for England Men.
insert into public.competitions (
  id, team_id, name, kind, season, knockout, age_group, gender,
  players_per_team, periods, minutes_per_period, result, venue_mode, venue_id
)
values (
  'd0000001-0000-4000-8000-000000000003',
  'bbbbbbbb-bbbb-cccc-dddd-000000000096',
  'Euro 96',
  'cup',
  '1995/96',
  true,
  'Adults',
  'male',
  11,
  '2',
  45,
  'semi_final',
  'multiple',
  null
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
  minutes_per_period = excluded.minutes_per_period,
  result = excluded.result,
  venue_mode = excluded.venue_mode,
  venue_id = excluded.venue_id;

-- England Men Euro 96 matches (all at Wembley).
insert into public.matches (
  id, team_id, opponent_name, date, kickoff_time, home_away, venue_id,
  competition_id, status, notes
)
values
  (
    'e0000003-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-000000000096',
    'Switzerland',
    '1996-06-08',
    '15:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000003',
    'played',
    'Group A — Wembley Stadium'
  ),
  (
    'e0000003-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-000000000096',
    'Scotland',
    '1996-06-15',
    '15:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000003',
    'played',
    'Group A — Wembley Stadium'
  ),
  (
    'e0000003-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-000000000096',
    'Netherlands',
    '1996-06-18',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000003',
    'played',
    'Group A — Wembley Stadium'
  ),
  (
    'e0000003-0000-4000-8000-000000000004',
    'bbbbbbbb-bbbb-cccc-dddd-000000000096',
    'Spain',
    '1996-06-22',
    '15:00',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000003',
    'played',
    'Quarter-final — won 4-2 on penalties after extra time'
  ),
  (
    'e0000003-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-cccc-dddd-000000000096',
    'Germany',
    '1996-06-26',
    '19:30',
    'home',
    'a0000003-0000-4000-8000-000000000003',
    'd0000001-0000-4000-8000-000000000003',
    'played',
    'Semi-final — lost 6-5 on penalties after extra time'
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

delete from public.match_periods
where match_id in (
  'e0000003-0000-4000-8000-000000000001',
  'e0000003-0000-4000-8000-000000000002',
  'e0000003-0000-4000-8000-000000000003',
  'e0000003-0000-4000-8000-000000000004',
  'e0000003-0000-4000-8000-000000000005'
);

insert into public.match_periods (id, match_id, name, sort_order)
values
  ('a2000003-0000-4000-8000-000000000011', 'e0000003-0000-4000-8000-000000000001', 'First half', 50),
  ('a2000003-0000-4000-8000-000000000012', 'e0000003-0000-4000-8000-000000000001', 'Second half', 60),
  ('a2000003-0000-4000-8000-000000000021', 'e0000003-0000-4000-8000-000000000002', 'First half', 50),
  ('a2000003-0000-4000-8000-000000000022', 'e0000003-0000-4000-8000-000000000002', 'Second half', 60),
  ('a2000003-0000-4000-8000-000000000031', 'e0000003-0000-4000-8000-000000000003', 'First half', 50),
  ('a2000003-0000-4000-8000-000000000032', 'e0000003-0000-4000-8000-000000000003', 'Second half', 60),
  ('a2000003-0000-4000-8000-000000000041', 'e0000003-0000-4000-8000-000000000004', 'First half', 50),
  ('a2000003-0000-4000-8000-000000000042', 'e0000003-0000-4000-8000-000000000004', 'Second half', 60),
  ('a2000003-0000-4000-8000-000000000043', 'e0000003-0000-4000-8000-000000000004', 'Extra time 1', 80),
  ('a2000003-0000-4000-8000-000000000044', 'e0000003-0000-4000-8000-000000000004', 'Extra time 2', 90),
  ('a2000003-0000-4000-8000-000000000051', 'e0000003-0000-4000-8000-000000000005', 'First half', 50),
  ('a2000003-0000-4000-8000-000000000052', 'e0000003-0000-4000-8000-000000000005', 'Second half', 60),
  ('a2000003-0000-4000-8000-000000000053', 'e0000003-0000-4000-8000-000000000005', 'Extra time 1', 80),
  ('a2000003-0000-4000-8000-000000000054', 'e0000003-0000-4000-8000-000000000005', 'Extra time 2', 90)
on conflict (id) do update set
  match_id = excluded.match_id,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- England Men Euro 96 goals.
insert into public.goals (
  id, match_id, player_id, assist_player_id, period_id, period, minute, is_opposition
)
values
  (
    'f0000003-0000-4000-8000-000000000001',
    'e0000003-0000-4000-8000-000000000001',
    'a0000003-0000-4000-8000-000000000009',
    null,
    'a2000003-0000-4000-8000-000000000011',
    'First half',
    23,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000002',
    'e0000003-0000-4000-8000-000000000001',
    null,
    null,
    'a2000003-0000-4000-8000-000000000012',
    'Second half',
    83,
    true
  ),
  (
    'f0000003-0000-4000-8000-000000000003',
    'e0000003-0000-4000-8000-000000000002',
    'a0000003-0000-4000-8000-000000000009',
    'a0000003-0000-4000-8000-000000000010',
    'a2000003-0000-4000-8000-000000000022',
    'Second half',
    53,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000004',
    'e0000003-0000-4000-8000-000000000002',
    'a0000003-0000-4000-8000-000000000008',
    'a0000003-0000-4000-8000-000000000011',
    'a2000003-0000-4000-8000-000000000022',
    'Second half',
    79,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000005',
    'e0000003-0000-4000-8000-000000000003',
    'a0000003-0000-4000-8000-000000000009',
    null,
    'a2000003-0000-4000-8000-000000000031',
    'First half',
    23,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000006',
    'e0000003-0000-4000-8000-000000000003',
    'a0000003-0000-4000-8000-000000000010',
    'a0000003-0000-4000-8000-000000000009',
    'a2000003-0000-4000-8000-000000000032',
    'Second half',
    51,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000007',
    'e0000003-0000-4000-8000-000000000003',
    'a0000003-0000-4000-8000-000000000009',
    'a0000003-0000-4000-8000-000000000010',
    'a2000003-0000-4000-8000-000000000032',
    'Second half',
    57,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000008',
    'e0000003-0000-4000-8000-000000000003',
    'a0000003-0000-4000-8000-000000000010',
    'a0000003-0000-4000-8000-000000000009',
    'a2000003-0000-4000-8000-000000000032',
    'Second half',
    62,
    false
  ),
  (
    'f0000003-0000-4000-8000-000000000009',
    'e0000003-0000-4000-8000-000000000003',
    null,
    null,
    'a2000003-0000-4000-8000-000000000032',
    'Second half',
    78,
    true
  ),
  (
    'f0000003-0000-4000-8000-00000000000a',
    'e0000003-0000-4000-8000-000000000005',
    'a0000003-0000-4000-8000-000000000009',
    'a0000003-0000-4000-8000-000000000008',
    'a2000003-0000-4000-8000-000000000051',
    'First half',
    3,
    false
  ),
  (
    'f0000003-0000-4000-8000-00000000000b',
    'e0000003-0000-4000-8000-000000000005',
    null,
    null,
    'a2000003-0000-4000-8000-000000000051',
    'First half',
    16,
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

-- Sample disciplinary cards (Euro 96).
insert into public.cards (
  id, match_id, player_id, coach_id, guardian_id, type, coach_notes, referee_notes, club_notes
)
values
  (
    'ca000003-0000-4000-8000-000000000001',
    'e0000003-0000-4000-8000-000000000001',
    'a0000003-0000-4000-8000-000000000002', -- Gary Neville
    null, null,
    'yellow_1st',
    'Booked for a late challenge.',
    null, null
  ),
  (
    'ca000003-0000-4000-8000-000000000002',
    'e0000003-0000-4000-8000-000000000005',
    'a0000003-0000-4000-8000-000000000008', -- Paul Gascoigne
    null, null,
    'yellow_1st',
    'Booked in the semi-final.',
    null, null
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

-- Match-day squad for the Euro 96 semi-final (starting XI).
delete from public.match_players
where match_id = 'e0000003-0000-4000-8000-000000000005'
  and player_id in (
    'a0000003-0000-4000-8000-000000000001',
    'a0000003-0000-4000-8000-000000000003',
    'a0000003-0000-4000-8000-000000000005',
    'a0000003-0000-4000-8000-000000000006',
    'a0000003-0000-4000-8000-000000000004',
    'a0000003-0000-4000-8000-000000000007',
    'a0000003-0000-4000-8000-000000000008',
    'a0000003-0000-4000-8000-000000000011',
    'a0000003-0000-4000-8000-000000000017',
    'a0000003-0000-4000-8000-000000000009',
    'a0000003-0000-4000-8000-000000000010'
  );

insert into public.match_players (id, match_id, player_id)
values
  ('a1000003-0000-4000-8000-000000000001', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000001'),
  ('a1000003-0000-4000-8000-000000000002', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000003'),
  ('a1000003-0000-4000-8000-000000000003', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000005'),
  ('a1000003-0000-4000-8000-000000000004', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000006'),
  ('a1000003-0000-4000-8000-000000000005', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000004'),
  ('a1000003-0000-4000-8000-000000000006', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000007'),
  ('a1000003-0000-4000-8000-000000000007', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000008'),
  ('a1000003-0000-4000-8000-000000000008', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000011'),
  ('a1000003-0000-4000-8000-000000000009', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000017'),
  ('a1000003-0000-4000-8000-000000000010', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000009'),
  ('a1000003-0000-4000-8000-000000000011', 'e0000003-0000-4000-8000-000000000005', 'a0000003-0000-4000-8000-000000000010')
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id;

-- ---------------------------------------------------------------------------
-- England Men: FIFA World Cup 2026
-- ---------------------------------------------------------------------------
-- Historical / publicly reported: Thomas Tuchel head coach; final 26-man squad
-- (Chalobah replaced injured Livramento at No.12); Group L fixtures and results
-- vs Croatia, Ghana, Panama; knockout results through the quarter-final
-- (DR Congo, Mexico, Norway aet).
-- Counterfactual (user requirement: competition result Champions): semi-final
-- and final path invented — England beat Argentina then France to lift the
-- trophy. Documented so reseed consumers can distinguish projected outcomes.

-- Head coach: Thomas Tuchel.
insert into public.people (id, first_name, last_name, account_status)
values (
  'e0000001-0000-4000-8000-000000000007',
  'Thomas',
  'Tuchel',
  'none'
)
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.coaches (
  id, club_id, person_id, joined_date, dbs_checked, fa_level_1, fa_level_2, biography
)
values (
  'c0000001-0000-4000-8000-000000000007',
  '11111111-1111-1111-1111-111111111111',
  'e0000001-0000-4000-8000-000000000007',
  '2025-01-01',
  true, true, true,
  'Thomas Tuchel (born 29 August 1973) became England head coach in 2025. A Champions League-winning club manager with Chelsea and Paris Saint-Germain, he guided England through a perfect World Cup qualifying campaign and into the 2026 finals in North America.'
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
  'bbbbbbbb-bbbb-cccc-dddd-000000002026',
  'c0000001-0000-4000-8000-000000000007',
  'Head Coach'
)
on conflict (team_id, coach_id) do update set role = excluded.role;

-- England Men World Cup 2026 squad (26).
insert into public.people (id, first_name, last_name, account_status)
values
  ('b0000004-0000-4000-8000-000000000001', 'Jordan', 'Pickford', 'none'),
  ('b0000004-0000-4000-8000-000000000002', 'Ezri', 'Konsa', 'none'),
  ('b0000004-0000-4000-8000-000000000003', 'Nico', 'O''Reilly', 'none'),
  ('b0000004-0000-4000-8000-000000000004', 'Declan', 'Rice', 'none'),
  ('b0000004-0000-4000-8000-000000000005', 'John', 'Stones', 'none'),
  ('b0000004-0000-4000-8000-000000000006', 'Marc', 'Guehi', 'none'),
  ('b0000004-0000-4000-8000-000000000007', 'Bukayo', 'Saka', 'none'),
  ('b0000004-0000-4000-8000-000000000008', 'Elliot', 'Anderson', 'none'),
  ('b0000004-0000-4000-8000-000000000009', 'Harry', 'Kane', 'none'),
  ('b0000004-0000-4000-8000-000000000010', 'Jude', 'Bellingham', 'none'),
  ('b0000004-0000-4000-8000-000000000011', 'Marcus', 'Rashford', 'none'),
  ('b0000004-0000-4000-8000-000000000012', 'Trevoh', 'Chalobah', 'none'),
  ('b0000004-0000-4000-8000-000000000013', 'Dean', 'Henderson', 'none'),
  ('b0000004-0000-4000-8000-000000000014', 'Jordan', 'Henderson', 'none'),
  ('b0000004-0000-4000-8000-000000000015', 'Dan', 'Burn', 'none'),
  ('b0000004-0000-4000-8000-000000000016', 'Kobbie', 'Mainoo', 'none'),
  ('b0000004-0000-4000-8000-000000000017', 'Morgan', 'Rogers', 'none'),
  ('b0000004-0000-4000-8000-000000000018', 'Anthony', 'Gordon', 'none'),
  ('b0000004-0000-4000-8000-000000000019', 'Ollie', 'Watkins', 'none'),
  ('b0000004-0000-4000-8000-000000000020', 'Noni', 'Madueke', 'none'),
  ('b0000004-0000-4000-8000-000000000021', 'Eberechi', 'Eze', 'none'),
  ('b0000004-0000-4000-8000-000000000022', 'Ivan', 'Toney', 'none'),
  ('b0000004-0000-4000-8000-000000000023', 'James', 'Trafford', 'none'),
  ('b0000004-0000-4000-8000-000000000024', 'Reece', 'James', 'none'),
  ('b0000004-0000-4000-8000-000000000025', 'Djed', 'Spence', 'none'),
  ('b0000004-0000-4000-8000-000000000026', 'Jarell', 'Quansah', 'none')
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name;

insert into public.players (id, club_id, person_id, position, date_of_birth)
values
  ('a0000004-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000001', 'GK', '1994-03-07'),
  ('a0000004-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000002', 'DEF', '1997-10-23'),
  ('a0000004-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000003', 'DEF', '2005-03-21'),
  ('a0000004-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000004', 'MID', '1999-01-14'),
  ('a0000004-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000005', 'DEF', '1994-05-28'),
  ('a0000004-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000006', 'DEF', '2000-07-13'),
  ('a0000004-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000007', 'FWD', '2001-09-05'),
  ('a0000004-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000008', 'MID', '2002-11-06'),
  ('a0000004-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000009', 'FWD', '1993-07-28'),
  ('a0000004-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000010', 'MID', '2003-06-29'),
  ('a0000004-0000-4000-8000-000000000011', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000011', 'FWD', '1997-10-31'),
  ('a0000004-0000-4000-8000-000000000012', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000012', 'DEF', '1999-07-05'),
  ('a0000004-0000-4000-8000-000000000013', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000013', 'GK', '1997-03-12'),
  ('a0000004-0000-4000-8000-000000000014', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000014', 'MID', '1990-06-17'),
  ('a0000004-0000-4000-8000-000000000015', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000015', 'DEF', '1992-05-09'),
  ('a0000004-0000-4000-8000-000000000016', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000016', 'MID', '2005-04-19'),
  ('a0000004-0000-4000-8000-000000000017', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000017', 'MID', '2002-07-26'),
  ('a0000004-0000-4000-8000-000000000018', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000018', 'FWD', '2001-02-24'),
  ('a0000004-0000-4000-8000-000000000019', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000019', 'FWD', '1995-12-30'),
  ('a0000004-0000-4000-8000-000000000020', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000020', 'FWD', '2002-03-10'),
  ('a0000004-0000-4000-8000-000000000021', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000021', 'MID', '1998-06-29'),
  ('a0000004-0000-4000-8000-000000000022', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000022', 'FWD', '1996-03-16'),
  ('a0000004-0000-4000-8000-000000000023', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000023', 'GK', '2002-10-10'),
  ('a0000004-0000-4000-8000-000000000024', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000024', 'DEF', '1999-12-08'),
  ('a0000004-0000-4000-8000-000000000025', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000025', 'DEF', '2000-08-09'),
  ('a0000004-0000-4000-8000-000000000026', '11111111-1111-1111-1111-111111111111', 'b0000004-0000-4000-8000-000000000026', 'DEF', '2003-01-29')
on conflict (id) do update set
  club_id = excluded.club_id,
  person_id = excluded.person_id,
  position = excluded.position,
  date_of_birth = excluded.date_of_birth;

insert into public.team_players (team_id, player_id, shirt_number, active)
values
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000001', 1, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000002', 2, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000003', 3, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000004', 4, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000005', 5, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000006', 6, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000007', 7, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000008', 8, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000009', 9, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000010', 10, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000011', 11, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000012', 12, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000013', 13, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000014', 14, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000015', 15, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000016', 16, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000017', 17, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000018', 18, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000019', 19, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000020', 20, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000021', 21, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000022', 22, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000023', 23, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000024', 24, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000025', 25, true),
  ('bbbbbbbb-bbbb-cccc-dddd-000000002026', 'a0000004-0000-4000-8000-000000000026', 26, true)
on conflict (team_id, player_id) do update set
  shirt_number = excluded.shirt_number,
  active = excluded.active;

-- World Cup 2025/26 competition for England Men (result: champions — counterfactual final path).
insert into public.competitions (
  id, team_id, name, kind, season, knockout, age_group, gender,
  players_per_team, periods, minutes_per_period, result, venue_mode, venue_id, notes
)
values (
  'd0000001-0000-4000-8000-000000000004',
  'bbbbbbbb-bbbb-cccc-dddd-000000002026',
  'World Cup',
  'cup',
  '2025/26',
  true,
  'Adults',
  'male',
  11,
  '2',
  45,
  'champions',
  'multiple',
  null,
  'Group + knockout through QF use reported 2026 results; SF vs Argentina and final vs France are projected champion-path fixtures.'
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
  minutes_per_period = excluded.minutes_per_period,
  result = excluded.result,
  venue_mode = excluded.venue_mode,
  venue_id = excluded.venue_id,
  notes = excluded.notes;

-- England Men World Cup 2026 matches.
insert into public.matches (
  id, team_id, opponent_name, date, kickoff_time, home_away, venue_id,
  competition_id, status, notes
)
values
  (
    'e0000004-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Croatia',
    '2026-06-17',
    '15:00',
    'home',
    'a0000027-0000-4000-8000-000000000027',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Group L — AT&T Stadium, Arlington'
  ),
  (
    'e0000004-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Ghana',
    '2026-06-23',
    '16:00',
    'home',
    'a0000028-0000-4000-8000-000000000028',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Group L — Gillette Stadium, Foxborough'
  ),
  (
    'e0000004-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Panama',
    '2026-06-27',
    '17:00',
    'away',
    'a0000029-0000-4000-8000-000000000029',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Group L — MetLife Stadium, East Rutherford'
  ),
  (
    'e0000004-0000-4000-8000-000000000004',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'DR Congo',
    '2026-07-01',
    '12:00',
    'home',
    'a0000030-0000-4000-8000-000000000030',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Round of 32 — Mercedes-Benz Stadium, Atlanta'
  ),
  (
    'e0000004-0000-4000-8000-000000000005',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Mexico',
    '2026-07-05',
    '19:00',
    'away',
    'a0000031-0000-4000-8000-000000000031',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Round of 16 — Estadio Azteca, Mexico City'
  ),
  (
    'e0000004-0000-4000-8000-000000000006',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Norway',
    '2026-07-11',
    '17:00',
    'away',
    'a0000032-0000-4000-8000-000000000032',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Quarter-final — after extra time — Hard Rock Stadium'
  ),
  (
    'e0000004-0000-4000-8000-000000000007',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'Argentina',
    '2026-07-15',
    '15:00',
    'home',
    'a0000030-0000-4000-8000-000000000030',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Semi-final — projected champion path (counterfactual)'
  ),
  (
    'e0000004-0000-4000-8000-000000000008',
    'bbbbbbbb-bbbb-cccc-dddd-000000002026',
    'France',
    '2026-07-19',
    '15:00',
    'home',
    'a0000032-0000-4000-8000-000000000032',
    'd0000001-0000-4000-8000-000000000004',
    'played',
    'Final — projected champion path (counterfactual)'
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

delete from public.match_periods
where match_id in (
  'e0000004-0000-4000-8000-000000000001',
  'e0000004-0000-4000-8000-000000000002',
  'e0000004-0000-4000-8000-000000000003',
  'e0000004-0000-4000-8000-000000000004',
  'e0000004-0000-4000-8000-000000000005',
  'e0000004-0000-4000-8000-000000000006',
  'e0000004-0000-4000-8000-000000000007',
  'e0000004-0000-4000-8000-000000000008'
);

insert into public.match_periods (id, match_id, name, sort_order)
values
  ('a2000004-0000-4000-8000-000000000011', 'e0000004-0000-4000-8000-000000000001', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000012', 'e0000004-0000-4000-8000-000000000001', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000021', 'e0000004-0000-4000-8000-000000000002', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000022', 'e0000004-0000-4000-8000-000000000002', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000031', 'e0000004-0000-4000-8000-000000000003', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000032', 'e0000004-0000-4000-8000-000000000003', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000041', 'e0000004-0000-4000-8000-000000000004', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000042', 'e0000004-0000-4000-8000-000000000004', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000051', 'e0000004-0000-4000-8000-000000000005', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000052', 'e0000004-0000-4000-8000-000000000005', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000061', 'e0000004-0000-4000-8000-000000000006', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000062', 'e0000004-0000-4000-8000-000000000006', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000063', 'e0000004-0000-4000-8000-000000000006', 'Extra time 1', 80),
  ('a2000004-0000-4000-8000-000000000064', 'e0000004-0000-4000-8000-000000000006', 'Extra time 2', 90),
  ('a2000004-0000-4000-8000-000000000071', 'e0000004-0000-4000-8000-000000000007', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000072', 'e0000004-0000-4000-8000-000000000007', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000081', 'e0000004-0000-4000-8000-000000000008', 'First half', 50),
  ('a2000004-0000-4000-8000-000000000082', 'e0000004-0000-4000-8000-000000000008', 'Second half', 60),
  ('a2000004-0000-4000-8000-000000000083', 'e0000004-0000-4000-8000-000000000008', 'Extra time 1', 80),
  ('a2000004-0000-4000-8000-000000000084', 'e0000004-0000-4000-8000-000000000008', 'Extra time 2', 90)
on conflict (id) do update set
  match_id = excluded.match_id,
  name = excluded.name,
  sort_order = excluded.sort_order;

-- England Men World Cup 2026 goals.
insert into public.goals (
  id, match_id, player_id, assist_player_id, period_id, period, minute, is_opposition
)
values
  (
    'f0000004-0000-4000-8000-000000000001',
    'e0000004-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000009',
    null,
    'a2000004-0000-4000-8000-000000000011',
    'First half',
    12,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000002',
    'e0000004-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000010',
    'a2000004-0000-4000-8000-000000000011',
    'First half',
    42,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000003',
    'e0000004-0000-4000-8000-000000000001',
    null,
    null,
    'a2000004-0000-4000-8000-000000000011',
    'First half',
    36,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000004',
    'e0000004-0000-4000-8000-000000000001',
    null,
    null,
    'a2000004-0000-4000-8000-000000000011',
    'First half',
    45,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000005',
    'e0000004-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000004',
    'a2000004-0000-4000-8000-000000000012',
    'Second half',
    47,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000006',
    'e0000004-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000011',
    'a0000004-0000-4000-8000-000000000017',
    'a2000004-0000-4000-8000-000000000012',
    'Second half',
    85,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000007',
    'e0000004-0000-4000-8000-000000000003',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000007',
    'a2000004-0000-4000-8000-000000000032',
    'Second half',
    62,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000008',
    'e0000004-0000-4000-8000-000000000003',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000010',
    'a2000004-0000-4000-8000-000000000032',
    'Second half',
    67,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000009',
    'e0000004-0000-4000-8000-000000000004',
    null,
    null,
    'a2000004-0000-4000-8000-000000000041',
    'First half',
    58,
    true
  ),
  (
    'f0000004-0000-4000-8000-00000000000a',
    'e0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000018',
    'a2000004-0000-4000-8000-000000000042',
    'Second half',
    75,
    false
  ),
  (
    'f0000004-0000-4000-8000-00000000000b',
    'e0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000007',
    'a2000004-0000-4000-8000-000000000042',
    'Second half',
    86,
    false
  ),
  (
    'f0000004-0000-4000-8000-00000000000c',
    'e0000004-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000004',
    'a2000004-0000-4000-8000-000000000051',
    'First half',
    36,
    false
  ),
  (
    'f0000004-0000-4000-8000-00000000000d',
    'e0000004-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000007',
    'a2000004-0000-4000-8000-000000000051',
    'First half',
    38,
    false
  ),
  (
    'f0000004-0000-4000-8000-00000000000e',
    'e0000004-0000-4000-8000-000000000005',
    null,
    null,
    'a2000004-0000-4000-8000-000000000051',
    'First half',
    42,
    true
  ),
  (
    'f0000004-0000-4000-8000-00000000000f',
    'e0000004-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000009',
    null,
    'a2000004-0000-4000-8000-000000000052',
    'Second half',
    60,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000010',
    'e0000004-0000-4000-8000-000000000005',
    null,
    null,
    'a2000004-0000-4000-8000-000000000052',
    'Second half',
    69,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000011',
    'e0000004-0000-4000-8000-000000000006',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000009',
    'a2000004-0000-4000-8000-000000000061',
    'First half',
    45,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000012',
    'e0000004-0000-4000-8000-000000000006',
    null,
    null,
    'a2000004-0000-4000-8000-000000000062',
    'Second half',
    70,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000013',
    'e0000004-0000-4000-8000-000000000006',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000018',
    'a2000004-0000-4000-8000-000000000063',
    'Extra time 1',
    93,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000014',
    'e0000004-0000-4000-8000-000000000007',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000010',
    'a2000004-0000-4000-8000-000000000071',
    'First half',
    34,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000015',
    'e0000004-0000-4000-8000-000000000007',
    null,
    null,
    'a2000004-0000-4000-8000-000000000072',
    'Second half',
    55,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000016',
    'e0000004-0000-4000-8000-000000000007',
    'a0000004-0000-4000-8000-000000000007',
    'a0000004-0000-4000-8000-000000000004',
    'a2000004-0000-4000-8000-000000000072',
    'Second half',
    71,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000017',
    'e0000004-0000-4000-8000-000000000008',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000007',
    'a2000004-0000-4000-8000-000000000081',
    'First half',
    28,
    false
  ),
  (
    'f0000004-0000-4000-8000-000000000018',
    'e0000004-0000-4000-8000-000000000008',
    null,
    null,
    'a2000004-0000-4000-8000-000000000082',
    'Second half',
    61,
    true
  ),
  (
    'f0000004-0000-4000-8000-000000000019',
    'e0000004-0000-4000-8000-000000000008',
    'a0000004-0000-4000-8000-000000000009',
    'a0000004-0000-4000-8000-000000000010',
    'a2000004-0000-4000-8000-000000000083',
    'Extra time 1',
    102,
    false
  )
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id,
  assist_player_id = excluded.assist_player_id,
  period_id = excluded.period_id,
  period = excluded.period,
  minute = excluded.minute,
  is_opposition = excluded.is_opposition;

-- Sample disciplinary cards (World Cup 2026).
insert into public.cards (
  id, match_id, player_id, coach_id, guardian_id, type, coach_notes, referee_notes, club_notes
)
values
  (
    'ca000004-0000-4000-8000-000000000001',
    'e0000004-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000026', -- Jarell Quansah
    null, null,
    'red',
    'Sent off in the round of 16.',
    null, null
  ),
  (
    'ca000004-0000-4000-8000-000000000002',
    'e0000004-0000-4000-8000-000000000007',
    'a0000004-0000-4000-8000-000000000004', -- Declan Rice
    null, null,
    'yellow_1st',
    'Booked in the semi-final.',
    null, null
  ),
  (
    'ca000004-0000-4000-8000-000000000003',
    'e0000004-0000-4000-8000-000000000008',
    null,
    'c0000001-0000-4000-8000-000000000007', -- Thomas Tuchel
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

-- Match-day squad for the World Cup final (starting XI).
delete from public.match_players
where match_id = 'e0000004-0000-4000-8000-000000000008'
  and player_id in (
    'a0000004-0000-4000-8000-000000000001',
    'a0000004-0000-4000-8000-000000000002',
    'a0000004-0000-4000-8000-000000000005',
    'a0000004-0000-4000-8000-000000000006',
    'a0000004-0000-4000-8000-000000000003',
    'a0000004-0000-4000-8000-000000000004',
    'a0000004-0000-4000-8000-000000000008',
    'a0000004-0000-4000-8000-000000000007',
    'a0000004-0000-4000-8000-000000000010',
    'a0000004-0000-4000-8000-000000000018',
    'a0000004-0000-4000-8000-000000000009'
  );

insert into public.match_players (id, match_id, player_id)
values
  ('a1000004-0000-4000-8000-000000000001', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000001'),
  ('a1000004-0000-4000-8000-000000000002', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000002'),
  ('a1000004-0000-4000-8000-000000000003', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000005'),
  ('a1000004-0000-4000-8000-000000000004', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000006'),
  ('a1000004-0000-4000-8000-000000000005', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000003'),
  ('a1000004-0000-4000-8000-000000000006', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000004'),
  ('a1000004-0000-4000-8000-000000000007', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000008'),
  ('a1000004-0000-4000-8000-000000000008', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000007'),
  ('a1000004-0000-4000-8000-000000000009', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000010'),
  ('a1000004-0000-4000-8000-000000000010', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000018'),
  ('a1000004-0000-4000-8000-000000000011', 'e0000004-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000009')
on conflict (id) do update set
  match_id = excluded.match_id,
  player_id = excluded.player_id;

-- Starting XI for each period of the World Cup final.
delete from public.match_period_starters
where period_id in (
  'a2000004-0000-4000-8000-000000000081',
  'a2000004-0000-4000-8000-000000000082',
  'a2000004-0000-4000-8000-000000000083',
  'a2000004-0000-4000-8000-000000000084'
);

insert into public.match_period_starters (period_id, player_id)
select period_id, player_id
from (
  values
    ('a2000004-0000-4000-8000-000000000081'::uuid),
    ('a2000004-0000-4000-8000-000000000082'::uuid),
    ('a2000004-0000-4000-8000-000000000083'::uuid),
    ('a2000004-0000-4000-8000-000000000084'::uuid)
) as periods(period_id)
cross join (
  values
    ('a0000004-0000-4000-8000-000000000001'::uuid),
    ('a0000004-0000-4000-8000-000000000002'::uuid),
    ('a0000004-0000-4000-8000-000000000005'::uuid),
    ('a0000004-0000-4000-8000-000000000006'::uuid),
    ('a0000004-0000-4000-8000-000000000003'::uuid),
    ('a0000004-0000-4000-8000-000000000004'::uuid),
    ('a0000004-0000-4000-8000-000000000008'::uuid),
    ('a0000004-0000-4000-8000-000000000007'::uuid),
    ('a0000004-0000-4000-8000-000000000010'::uuid),
    ('a0000004-0000-4000-8000-000000000018'::uuid),
    ('a0000004-0000-4000-8000-000000000009'::uuid)
) as squad(player_id)
on conflict (period_id, player_id) do nothing;

commit;
