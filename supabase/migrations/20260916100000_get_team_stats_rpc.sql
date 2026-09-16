-- Single-round-trip team stats RPC.
--
-- Implements performance recommendations:
--   §5.1 — Composite RPC for stats (replaces 7+ parallel functions on the stats page)
--   §6.4 — Push stats aggregation into Postgres (replaces JS-level group-by / count / sort)
--
-- Replaces the 5 heavy stats-page functions with one Postgres call:
--   getGoalsByPlayerStats()       — 4 sequential DB calls → 0 (folded into CTE)
--   getAssistsByPlayerStats()     — 3 DB calls           → 0
--   getPlayerOfTheMatchByPlayerStats() — 1 DB call       → 0
--   getMatchesPlayedByPlayerStats()    — 1 DB call       → 0
--   getResultsOverTime()          — 1 DB call            → 0
-- Plus the shared getShirtByPlayer() helper called once per batch.
-- Total: ~11 DB calls → 1 DB call per stats page load.
--
-- The function accepts a team ID and returns JSONB with keys:
--   shirt_numbers          — { [player_id]: shirt_number | null }
--   goals_by_player        — [{ player_id, first_name, last_name, position,
--                               goals, matches_played, periods_played,
--                               goal_competitions }]
--   assists_by_player      — [{ player_id, first_name, last_name,
--                               assists, matches_played, competitions }]
--   potm_by_player         — [{ player_id, first_name, last_name,
--                               count, competitions }]
--   matches_played_by_player — [{ player_id, first_name, last_name,
--                               count, competitions }]
--   results_over_time      — [{ match_id, date, opponent_name, goals_for,
--                               goals_against, competition_id, competition_kind,
--                               competition_name, is_friendly }]
--
-- Competition arrays keep one entry per event so the TypeScript client can
-- still perform client-side competition filtering (unchanged UI behaviour).
--
-- SECURITY INVOKER so Postgres evaluates RLS for the calling user; the caller
-- must hold an authenticated session with read access to the team's data.

create or replace function public.get_team_stats(p_team_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  -- -------------------------------------------------------------------------
  -- played_matches: base set for all stats (status = 'played' for this team)
  -- -------------------------------------------------------------------------
  played_matches as (
    select
      m.id,
      m.date,
      m.opponent_name,
      m.competition_id,
      m.is_friendly,
      m.created_at,
      m.player_of_the_match_id,
      c.kind  as competition_kind,
      c.name  as competition_name
    from public.matches m
    left join public.competitions c on c.id = m.competition_id
    where m.team_id = p_team_id
      and m.status  = 'played'
  ),

  -- -------------------------------------------------------------------------
  -- shirt_numbers: current shirt assignments for this team
  -- -------------------------------------------------------------------------
  shirt_numbers as (
    select tp.player_id, tp.shirt_number
    from public.team_players tp
    where tp.team_id = p_team_id
  ),

  -- -------------------------------------------------------------------------
  -- goal_scorer_appearances: how many played-match appearances each goal scorer
  -- has recorded in match_players (used to populate GoalsByPlayerPoint.matchesPlayed)
  -- -------------------------------------------------------------------------
  goal_scorer_appearances as (
    select mp.player_id, count(*) as matches_played
    from public.match_players mp
    where mp.match_id in (select id from played_matches)
    group by mp.player_id
  ),

  -- -------------------------------------------------------------------------
  -- goal_scorer_periods: how many match-period starts each goal scorer has
  -- (used to populate GoalsByPlayerPoint.periodsPlayed)
  -- -------------------------------------------------------------------------
  goal_scorer_periods as (
    select mps.player_id, count(*) as periods_played
    from public.match_period_starters mps
    join public.match_periods mpd on mpd.id = mps.period_id
    where mpd.match_id in (select id from played_matches)
    group by mps.player_id
  ),

  -- -------------------------------------------------------------------------
  -- goals_by_player: aggregate goals per player with per-goal competition data
  -- -------------------------------------------------------------------------
  goals_by_player as (
    select
      pl.id                                                   as player_id,
      p.first_name,
      p.last_name,
      pl.position,
      count(*)                                                as goals,
      coalesce(gsa.matches_played, 0)                         as matches_played,
      coalesce(gsp.periods_played, 0)                         as periods_played,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   pm.competition_id,
          'competitionKind', pm.competition_kind,
          'isFriendly',      pm.is_friendly
        )
      )                                                       as goal_competitions
    from public.goals g
    join played_matches pm  on pm.id  = g.match_id
    join public.players pl  on pl.id  = g.player_id
    join public.people  p   on p.id   = pl.person_id
    left join goal_scorer_appearances gsa on gsa.player_id = pl.id
    left join goal_scorer_periods     gsp on gsp.player_id = pl.id
    where not g.is_opposition
      and g.player_id is not null
    group by pl.id, p.first_name, p.last_name, pl.position, gsa.matches_played, gsp.periods_played
  ),

  -- -------------------------------------------------------------------------
  -- assists_by_player: aggregate assists per player with per-assist competition data
  -- -------------------------------------------------------------------------
  assists_by_player as (
    select
      pl.id                                                   as player_id,
      p.first_name,
      p.last_name,
      count(*)                                                as assists,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   pm.competition_id,
          'competitionKind', pm.competition_kind,
          'isFriendly',      pm.is_friendly
        )
      )                                                       as competitions
    from public.goals g
    join played_matches pm  on pm.id  = g.match_id
    join public.players pl  on pl.id  = g.assist_player_id
    join public.people  p   on p.id   = pl.person_id
    where not g.is_opposition
      and g.assist_player_id is not null
    group by pl.id, p.first_name, p.last_name
  ),

  -- -------------------------------------------------------------------------
  -- assist_appearances: appearances for players in the assists list
  -- -------------------------------------------------------------------------
  assist_appearances as (
    select mp.player_id, count(*) as matches_played
    from public.match_players mp
    where mp.match_id in (select id from played_matches)
    group by mp.player_id
  ),

  -- -------------------------------------------------------------------------
  -- potm_by_player: coach-selected player-of-the-match per player
  -- -------------------------------------------------------------------------
  potm_by_player as (
    select
      pl.id                                                   as player_id,
      p.first_name,
      p.last_name,
      count(*)                                                as potm_count,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   pm.competition_id,
          'competitionKind', pm.competition_kind,
          'isFriendly',      pm.is_friendly
        )
      )                                                       as competitions
    from played_matches pm
    join public.players pl  on pl.id  = pm.player_of_the_match_id
    join public.people  p   on p.id   = pl.person_id
    where pm.player_of_the_match_id is not null
    group by pl.id, p.first_name, p.last_name
  ),

  -- -------------------------------------------------------------------------
  -- matches_played_by_player: all match appearances (all matches, not just played)
  -- -------------------------------------------------------------------------
  matches_played_by_player as (
    select
      pl.id                                                   as player_id,
      p.first_name,
      p.last_name,
      count(*)                                                as match_count,
      jsonb_agg(
        jsonb_build_object(
          'competitionId',   m.competition_id,
          'competitionKind', c.kind,
          'isFriendly',      m.is_friendly
        )
      )                                                       as competitions
    from public.match_players mp
    join public.matches     m  on m.id  = mp.match_id
    join public.players     pl on pl.id = mp.player_id
    join public.people      p  on p.id  = pl.person_id
    left join public.competitions c on c.id = m.competition_id
    where m.team_id = p_team_id
    group by pl.id, p.first_name, p.last_name
  ),

  -- -------------------------------------------------------------------------
  -- results_over_time: per-match W/D/L data with goal tallies
  -- -------------------------------------------------------------------------
  results_over_time as (
    select
      pm.id                                                   as match_id,
      pm.date,
      pm.opponent_name,
      pm.competition_id,
      pm.competition_kind,
      pm.competition_name,
      pm.is_friendly,
      pm.created_at,
      count(g.id) filter (where g.id is not null and not g.is_opposition) as goals_for,
      count(g.id) filter (where g.id is not null and     g.is_opposition) as goals_against
    from played_matches pm
    left join public.goals g on g.match_id = pm.id
    group by pm.id, pm.date, pm.opponent_name, pm.competition_id,
             pm.competition_kind, pm.competition_name, pm.is_friendly, pm.created_at
  )

  -- -------------------------------------------------------------------------
  -- Final JSONB assembly
  -- -------------------------------------------------------------------------
  select jsonb_build_object(

    -- Shirt number lookup: { "player-uuid": 7 | null }
    'shirt_numbers',
    coalesce(
      (select jsonb_object_agg(player_id::text, shirt_number) from shirt_numbers),
      '{}'::jsonb
    ),

    -- Goals by player (sorted by goals desc, with appearances + periods inline)
    'goals_by_player',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'player_id',         gbp.player_id,
            'first_name',        gbp.first_name,
            'last_name',         gbp.last_name,
            'position',          gbp.position,
            'goals',             gbp.goals,
            'matches_played',    gbp.matches_played,
            'periods_played',    gbp.periods_played,
            'goal_competitions', gbp.goal_competitions
          )
          order by gbp.goals desc
        )
        from goals_by_player gbp
      ),
      '[]'::jsonb
    ),

    -- Assists by player (sorted by assists desc, with appearances inline)
    'assists_by_player',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'player_id',      abp.player_id,
            'first_name',     abp.first_name,
            'last_name',      abp.last_name,
            'assists',        abp.assists,
            'matches_played', coalesce(aa.matches_played, 0),
            'competitions',   abp.competitions
          )
          order by abp.assists desc
        )
        from assists_by_player abp
        left join assist_appearances aa on aa.player_id = abp.player_id
      ),
      '[]'::jsonb
    ),

    -- POTM by player (sorted by count desc)
    'potm_by_player',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'player_id',  ppp.player_id,
            'first_name', ppp.first_name,
            'last_name',  ppp.last_name,
            'count',      ppp.potm_count,
            'competitions', ppp.competitions
          )
          order by ppp.potm_count desc
        )
        from potm_by_player ppp
      ),
      '[]'::jsonb
    ),

    -- Appearances by player (sorted by count desc)
    'matches_played_by_player',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'player_id',  mpp.player_id,
            'first_name', mpp.first_name,
            'last_name',  mpp.last_name,
            'count',      mpp.match_count,
            'competitions', mpp.competitions
          )
          order by mpp.match_count desc
        )
        from matches_played_by_player mpp
      ),
      '[]'::jsonb
    ),

    -- Results over time (sorted chronologically)
    'results_over_time',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'match_id',          rot.match_id,
            'date',              rot.date,
            'opponent_name',     rot.opponent_name,
            'goals_for',         rot.goals_for,
            'goals_against',     rot.goals_against,
            'competition_id',    rot.competition_id,
            'competition_kind',  rot.competition_kind,
            'competition_name',  rot.competition_name,
            'is_friendly',       rot.is_friendly
          )
          order by rot.date asc, rot.created_at asc
        )
        from results_over_time rot
      ),
      '[]'::jsonb
    )

  );
$$;

revoke all on function public.get_team_stats(uuid) from public;
grant execute on function public.get_team_stats(uuid) to authenticated;
