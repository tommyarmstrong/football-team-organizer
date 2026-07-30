-- Shirt numbers are not unique within a team.
drop index if exists public.team_players_shirt_number_uidx;
