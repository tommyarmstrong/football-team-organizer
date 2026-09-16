-- Single-round-trip viewer context RPC.
--
-- Implements performance recommendations:
--   §6.2 — Single RPC for viewer context
--   §4.1 — Composite RPC for header data (includes clubs for getPrimaryClub)
--
-- Replaces 7 individual queries in getViewerContext() with one Postgres call:
--   1. people (by auth_user_id)
--   2. managers (by person_id)
--   3. team_members (by user_id)
--   4. guardians (by person_id)
--   5. player_guardians (via guardian ids)
--   6. players (self_players, by person_id)
--   7. teams (RLS-filtered)
--   + clubs (RLS-filtered, was a separate listVisibleClubs() call in getPrimaryClub)
--
-- The function uses SECURITY DEFINER so it can join across tables that have
-- mutually-dependent RLS policies (e.g. teams ↔ player_guardians) without
-- triggering infinite recursion. It relies on auth.uid() for all filtering;
-- callers must hold an authenticated session.
--
-- Returns: JSONB with keys:
--   person         — { id, first_name, last_name } | null
--   managers       — [{ club_id }]
--   team_members   — [{ team_id, role }]
--   guardians      — [{ id, player_guardians: [{ player_id }] }]
--   self_players   — [{ id }]
--   teams          — [Team row, ordered by name]
--   clubs          — [Club row, ordered by name]

create or replace function public.get_viewer_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid  uuid;
  v_pid  uuid;
  v_result jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return null;
  end if;

  -- Resolve the people row linked to this auth user.
  select id into v_pid
  from public.people
  where auth_user_id = v_uid
  limit 1;

  select jsonb_build_object(
    -- -------------------------------------------------------------------------
    -- Person identity
    -- -------------------------------------------------------------------------
    'person',
    case when v_pid is not null then (
      select jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name
      )
      from public.people p
      where p.id = v_pid
    ) else null end,

    -- -------------------------------------------------------------------------
    -- Club-management roles (via managers table)
    -- -------------------------------------------------------------------------
    'managers',
    coalesce((
      select jsonb_agg(jsonb_build_object('club_id', m.club_id))
      from public.managers m
      where m.person_id = v_pid
    ), '[]'::jsonb),

    -- -------------------------------------------------------------------------
    -- Team-membership roles (coach, management, guardian, player, etc.)
    -- -------------------------------------------------------------------------
    'team_members',
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'team_id', tm.team_id,
        'role',    tm.role
      ))
      from public.team_members tm
      where tm.user_id = v_uid
    ), '[]'::jsonb),

    -- -------------------------------------------------------------------------
    -- Guardian records with nested player links
    -- -------------------------------------------------------------------------
    'guardians',
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'player_guardians', coalesce((
          select jsonb_agg(jsonb_build_object('player_id', pg.player_id))
          from public.player_guardians pg
          where pg.guardian_id = g.id
        ), '[]'::jsonb)
      ))
      from public.guardians g
      where g.person_id = v_pid
    ), '[]'::jsonb),

    -- -------------------------------------------------------------------------
    -- Self-player records (the person's own player profiles)
    -- -------------------------------------------------------------------------
    'self_players',
    coalesce((
      select jsonb_agg(jsonb_build_object('id', pl.id))
      from public.players pl
      where pl.person_id = v_pid
    ), '[]'::jsonb),

    -- -------------------------------------------------------------------------
    -- RLS-visible teams (ordered by name for display).
    -- can_read_team_row avoids the recursive can_read_team() path and is safe
    -- inside a SECURITY DEFINER function.
    -- -------------------------------------------------------------------------
    'teams',
    coalesce((
      select jsonb_agg(to_jsonb(t.*) order by t.name)
      from public.teams t
      where public.can_read_team_row(t.id, t.club_id)
    ), '[]'::jsonb),

    -- -------------------------------------------------------------------------
    -- RLS-visible clubs (ordered by name).
    -- Included here so callers (e.g. getPrimaryClub) avoid a second DB round-trip.
    -- -------------------------------------------------------------------------
    'clubs',
    coalesce((
      select jsonb_agg(to_jsonb(c.*) order by c.name)
      from public.clubs c
      where public.can_read_club(c.id)
    ), '[]'::jsonb)

  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_viewer_context() from public;
grant execute on function public.get_viewer_context() to authenticated;
