-- Change a match between halves and quarters while it is being played.
--
-- Referees do not always say up front whether a match is two halves or four
-- quarters. A fixture set up with the wrong format used to mean deleting the
-- periods and recreating them, which dropped the goals' period link and the
-- starting players.
--
-- The app works out the change (see src/lib/match-periods/format-change.ts):
-- the nth period recorded becomes the nth period of the new format, extra
-- periods fold into the last one, and missing periods are created. This
-- function applies that plan in one transaction so a match is never left
-- half-converted:
--
--   p_keep    [{ period_id, from_name, name, sort_order }]
--             Rename an existing period. Goals linked to it, and goals that
--             only carry its old text label, are relabelled. Starters stay.
--   p_merge   [{ period_id, into_period_id, from_name }]
--             Move the period's goals onto another period, then delete it
--             (its starting players go with it).
--   p_create  [{ name, sort_order }]
--             Create a period. If p_copy_starters_from is set, the new period
--             gets the same starting players as that period.
--
-- Order of work: keep, then merge, then create, so merged goals pick up the
-- final name of the period they move onto.
--
-- SECURITY INVOKER: every statement runs under the caller's RLS, so only
-- people who can edit the match's periods and goals can change the format. Each
-- rename and delete is checked to have touched exactly one row, so a policy
-- that silently filters a row aborts the whole change instead of skipping it.

create or replace function public.change_match_period_format(
  p_match_id uuid,
  p_keep jsonb,
  p_merge jsonb,
  p_create jsonb,
  p_copy_starters_from uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status public.match_status;
  v_item jsonb;
  v_rows integer;
  v_into_name text;
  v_new_id uuid;
begin
  select m.status into v_status
  from public.matches m
  where m.id = p_match_id;

  if not found then
    raise exception 'Match not found.';
  end if;

  if v_status not in ('in_progress', 'played') then
    raise exception 'The period format can only be changed when the match is in progress or played.';
  end if;

  -- Every period named in the plan must belong to this match.
  if exists (
    select 1
    from (
      select (e ->> 'period_id')::uuid as period_id
      from jsonb_array_elements(coalesce(p_keep, '[]'::jsonb)) e
      union all
      select (e ->> 'period_id')::uuid
      from jsonb_array_elements(coalesce(p_merge, '[]'::jsonb)) e
      union all
      select (e ->> 'into_period_id')::uuid
      from jsonb_array_elements(coalesce(p_merge, '[]'::jsonb)) e
      union all
      select p_copy_starters_from
      where p_copy_starters_from is not null
    ) ids
    where not exists (
      select 1
      from public.match_periods mp
      where mp.id = ids.period_id
        and mp.match_id = p_match_id
    )
  ) then
    raise exception 'Period does not belong to this match.';
  end if;

  -- 1. Rename the periods that stay.
  for v_item in
    select e from jsonb_array_elements(coalesce(p_keep, '[]'::jsonb)) e
  loop
    update public.match_periods
    set name = v_item ->> 'name',
        sort_order = (v_item ->> 'sort_order')::integer
    where id = (v_item ->> 'period_id')::uuid
      and match_id = p_match_id;

    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'You do not have permission to change this match.';
    end if;

    update public.goals
    set period = v_item ->> 'name'
    where match_id = p_match_id
      and period_id = (v_item ->> 'period_id')::uuid;

    -- Goals with only a text label and no period link.
    update public.goals
    set period = v_item ->> 'name'
    where match_id = p_match_id
      and period_id is null
      and period = v_item ->> 'from_name';
  end loop;

  -- 2. Fold merged periods into the one they join, then remove them.
  for v_item in
    select e from jsonb_array_elements(coalesce(p_merge, '[]'::jsonb)) e
  loop
    select mp.name into v_into_name
    from public.match_periods mp
    where mp.id = (v_item ->> 'into_period_id')::uuid;

    update public.goals
    set period_id = (v_item ->> 'into_period_id')::uuid,
        period = v_into_name
    where match_id = p_match_id
      and period_id = (v_item ->> 'period_id')::uuid;

    update public.goals
    set period = v_into_name
    where match_id = p_match_id
      and period_id is null
      and period = v_item ->> 'from_name';

    delete from public.match_periods
    where id = (v_item ->> 'period_id')::uuid
      and match_id = p_match_id;

    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'You do not have permission to change this match.';
    end if;
  end loop;

  -- 3. Create the periods the new format needs.
  for v_item in
    select e from jsonb_array_elements(coalesce(p_create, '[]'::jsonb)) e
  loop
    insert into public.match_periods (match_id, name, sort_order)
    values (
      p_match_id,
      v_item ->> 'name',
      (v_item ->> 'sort_order')::integer
    )
    returning id into v_new_id;

    if p_copy_starters_from is not null then
      insert into public.match_period_starters (period_id, player_id)
      select v_new_id, mps.player_id
      from public.match_period_starters mps
      where mps.period_id = p_copy_starters_from;
    end if;
  end loop;
end;
$$;

revoke all on function public.change_match_period_format(uuid, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.change_match_period_format(uuid, jsonb, jsonb, jsonb, uuid) to authenticated;
