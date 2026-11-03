-- Period starts per player, for the club-manager-only "Period starts" section
-- of the Stats page.
--
-- One entry per player who started at least one period of a played match for
-- the team. `competitions` has one element per period start (the competition of
-- the match), so the app can filter by competition and competition type and
-- count the matching entries, the same way it does for assists and appearances.
--
-- A period start is a row in match_period_starters ("Starting players" for a
-- period). Games are not returned here; the app uses the player's appearances
-- from get_team_stats for "Periods per game".
--
-- SECURITY INVOKER so Postgres evaluates RLS for the calling user. The function
-- also returns an empty list unless the caller manages the team's club, so
-- coaches and other members never receive this data.

create or replace function public.get_period_starts_by_player(p_team_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  period_starts as (
    select
      pl.id           as player_id,
      pl.person_id,
      p.first_name,
      p.last_name,
      pl.position,
      m.competition_id,
      m.is_friendly,
      c.kind          as competition_kind
    from public.teams t
    join public.matches m              on m.team_id  = t.id
    join public.match_periods mpd      on mpd.match_id = m.id
    join public.match_period_starters mps on mps.period_id = mpd.id
    join public.players pl             on pl.id = mps.player_id
    join public.people p               on p.id  = pl.person_id
    left join public.competitions c    on c.id  = m.competition_id
    where t.id = p_team_id
      and m.status = 'played'
      and public.is_club_management(t.club_id)
  ),
  by_player as (
    select
      ps.player_id,
      ps.person_id,
      ps.first_name,
      ps.last_name,
      ps.position,
      count(*)                                                as period_count,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   ps.competition_id,
          'competitionKind', ps.competition_kind,
          'isFriendly',      ps.is_friendly
        )
      )                                                       as competitions
    from period_starts ps
    group by ps.player_id, ps.person_id, ps.first_name, ps.last_name, ps.position
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'player_id',    bp.player_id,
        'person_id',    bp.person_id,
        'first_name',   bp.first_name,
        'last_name',    bp.last_name,
        'position',     bp.position,
        'count',        bp.period_count,
        'competitions', bp.competitions
      )
      order by bp.period_count desc, bp.last_name asc, bp.first_name asc
    ),
    '[]'::jsonb
  )
  from by_player bp;
$$;

revoke all on function public.get_period_starts_by_player(uuid) from public;
grant execute on function public.get_period_starts_by_player(uuid) to authenticated;
