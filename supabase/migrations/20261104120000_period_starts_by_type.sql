-- Period starts by period type, plus the periods in each player's games.
--
-- Replaces get_period_starts_by_player (club-manager-only "Period starts"
-- section of the Stats page) so the app can:
--   * filter by period Type (quarters / halves / extra time), and
--   * show "Periods per game (%)": the periods a player started as a percent of
--     the periods in the games they played.
--
-- Changes from the previous definition:
--   * every entry in `competitions` (one per period start) gains `periodType`.
--   * each player gains `periods_in_games`: one entry per period of every
--     played match the player was in, with the same keys as `competitions`.
--     A player was "in" a match if they are in its match-day squad or started
--     one of its periods.
--
-- periodType is derived from the period name:
--   'Quarter 1'..'Quarter 4'          -> 'quarters'
--   'First half', 'Second half'       -> 'halves'
--   'Extra time 1', 'Extra time 2'    -> 'extra_time'
--   anything else (single period match, penalty shootout) -> 'other'
-- 'other' periods only count when the app's Type filter is "All".
--
-- Still one entry per player who started at least one period of a played match
-- for the team. SECURITY INVOKER so Postgres evaluates RLS for the calling
-- user, and an empty list unless the caller manages the team's club.

create or replace function public.get_period_starts_by_player(p_team_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  -- Every period of every played match for the team.
  played_periods as (
    select
      m.id            as match_id,
      mpd.id          as period_id,
      case
        when mpd.name like 'Quarter %'          then 'quarters'
        when mpd.name in ('First half', 'Second half') then 'halves'
        when mpd.name like 'Extra time %'       then 'extra_time'
        else 'other'
      end             as period_type,
      m.competition_id,
      m.is_friendly,
      c.kind          as competition_kind
    from public.teams t
    join public.matches m              on m.team_id  = t.id
    join public.match_periods mpd      on mpd.match_id = m.id
    left join public.competitions c    on c.id  = m.competition_id
    where t.id = p_team_id
      and m.status = 'played'
      and public.is_club_management(t.club_id)
  ),
  -- A period start is a row in match_period_starters ("Starting players").
  period_starts as (
    select
      mps.player_id,
      pp.match_id,
      pp.period_type,
      pp.competition_id,
      pp.is_friendly,
      pp.competition_kind
    from public.match_period_starters mps
    join played_periods pp on pp.period_id = mps.period_id
  ),
  -- The played matches each player was in: squad or starter.
  player_games as (
    select mp.player_id, mp.match_id
    from public.match_players mp
    where mp.match_id in (select pp.match_id from played_periods pp)
    union
    select ps.player_id, ps.match_id
    from period_starts ps
  ),
  starts_by_player as (
    select
      ps.player_id,
      count(*) as period_count,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   ps.competition_id,
          'competitionKind', ps.competition_kind,
          'isFriendly',      ps.is_friendly,
          'periodType',      ps.period_type
        )
      )        as competitions
    from period_starts ps
    group by ps.player_id
  ),
  periods_in_games_by_player as (
    select
      pg.player_id,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   pp.competition_id,
          'competitionKind', pp.competition_kind,
          'isFriendly',      pp.is_friendly,
          'periodType',      pp.period_type
        )
      )        as periods_in_games
    from player_games pg
    join played_periods pp on pp.match_id = pg.match_id
    group by pg.player_id
  ),
  by_player as (
    select
      sbp.player_id,
      pl.person_id,
      p.first_name,
      p.last_name,
      pl.position,
      sbp.period_count,
      sbp.competitions,
      coalesce(pig.periods_in_games, '[]'::jsonb) as periods_in_games
    from starts_by_player sbp
    join public.players pl on pl.id = sbp.player_id
    join public.people p   on p.id  = pl.person_id
    left join periods_in_games_by_player pig on pig.player_id = sbp.player_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'player_id',        bp.player_id,
        'person_id',        bp.person_id,
        'first_name',       bp.first_name,
        'last_name',        bp.last_name,
        'position',         bp.position,
        'count',            bp.period_count,
        'competitions',     bp.competitions,
        'periods_in_games', bp.periods_in_games
      )
      order by bp.period_count desc, bp.last_name asc, bp.first_name asc
    ),
    '[]'::jsonb
  )
  from by_player bp;
$$;

revoke all on function public.get_period_starts_by_player(uuid) from public;
grant execute on function public.get_period_starts_by_player(uuid) to authenticated;
