-- Removing a player from a match-day squad also removes their period starts
-- for that match.
--
-- match_period_starters has no link to match_players, so taking a player out of
-- the squad used to leave their "Starting players" rows behind. The period pages
-- only list starters who are in the squad, so those rows were invisible in the
-- app, but the Stats functions (get_team_stats, get_period_starts_by_player)
-- still counted them as periods played.
--
-- A trigger keeps the two tables in step for every write path: the app, the
-- Supabase SQL editor, scripts and future code. It runs in the same transaction
-- as the squad delete, so the two cannot drift apart.
--
-- SECURITY DEFINER so the cleanup does not depend on the caller's RLS on
-- match_period_starters (for example during a cascade from a deleted match or
-- player). It only deletes starter rows for the exact match and player that were
-- removed from match_players.

create or replace function public.delete_period_starters_for_removed_squad_player()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.match_period_starters mps
  using public.match_periods mp
  where mp.id = mps.period_id
    and mp.match_id = old.match_id
    and mps.player_id = old.player_id;

  return old;
end;
$$;

revoke all on function public.delete_period_starters_for_removed_squad_player()
  from public;

drop trigger if exists match_players_delete_period_starters
  on public.match_players;
create trigger match_players_delete_period_starters
after delete on public.match_players
for each row
execute function public.delete_period_starters_for_removed_squad_player();
