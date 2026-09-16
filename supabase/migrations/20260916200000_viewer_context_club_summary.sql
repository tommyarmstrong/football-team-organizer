-- §6.3 — Return only the club columns needed for header / primary-club
-- resolution from get_viewer_context(), instead of to_jsonb(c.*) (all columns).
-- Club pages that need website/about/contact load the full row via getClub().

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

    'managers',
    coalesce((
      select jsonb_agg(jsonb_build_object('club_id', m.club_id))
      from public.managers m
      where m.person_id = v_pid
    ), '[]'::jsonb),

    'team_members',
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'team_id', tm.team_id,
        'role',    tm.role
      ))
      from public.team_members tm
      where tm.user_id = v_uid
    ), '[]'::jsonb),

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

    'self_players',
    coalesce((
      select jsonb_agg(jsonb_build_object('id', pl.id))
      from public.players pl
      where pl.person_id = v_pid
    ), '[]'::jsonb),

    'teams',
    coalesce((
      select jsonb_agg(to_jsonb(t.*) order by t.name)
      from public.teams t
      where public.can_read_team_row(t.id, t.club_id)
    ), '[]'::jsonb),

    -- Summary columns only (§6.3).
    'clubs',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'colour', c.colour,
          'icon_url', c.icon_url
        )
        order by c.name
      )
      from public.clubs c
      where public.can_read_club(c.id)
    ), '[]'::jsonb)

  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_viewer_context() from public;
grant execute on function public.get_viewer_context() to authenticated;
