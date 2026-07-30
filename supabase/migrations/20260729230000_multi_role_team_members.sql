-- Allow any combination of roles per auth user per team.
-- Previously unique (team_id, user_id) forced a single role; replace with
-- unique (team_id, user_id, role). Also add team-scoped management.

alter type public.team_role add value if not exists 'management';

alter table public.team_members
  drop constraint if exists team_members_team_user_unique;

alter table public.team_members
  add constraint team_members_team_user_role_unique
  unique (team_id, user_id, role);
